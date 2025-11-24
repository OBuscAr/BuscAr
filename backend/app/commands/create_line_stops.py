import csv
import logging
import os
from uuid import UUID

import pandas as pd
from geodistpy import geodist
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import LineModel, LineStopModel, StopModel
from app.schemas import Point, SPTransLineDirection, SPTransLineStop, SPTransShape
from app.services import distance_service

logger = logging.getLogger(__name__)
SHAPES_FILE = os.path.join(SPTRANS_DATA_PATH, "shapes.txt")
TRIPS_FILE = os.path.join(SPTRANS_DATA_PATH, "trips.txt")
STOPS_FILE = os.path.join(SPTRANS_DATA_PATH, "stop_times.txt")


def load_trips() -> dict[str, str]:
    mapping: dict[str, str] = {}
    with open(TRIPS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            trip_id = row["trip_id"].strip()
            if trip_id not in mapping:
                mapping[trip_id] = row["shape_id"]
            else:
                logger.warning(f"Trip {trip_id} tem multiples shapes")
    return mapping


def load_shapes() -> dict[str, list[SPTransShape]]:
    shapes: dict[str, list[SPTransShape]] = {}
    with open(SHAPES_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            shape_id = row["shape_id"]
            shapes.setdefault(shape_id, []).append(
                SPTransShape(
                    latitude=float(row["shape_pt_lat"]),
                    longitude=float(row["shape_pt_lon"]),
                    sequence=int(row["shape_pt_sequence"]),
                    distance=float(row["shape_dist_traveled"]) / 1000,
                )
            )

    # ordenar
    for sid in shapes:
        shapes[sid].sort(key=lambda p: p.sequence)

    return shapes


def load_line_stops() -> list[SPTransLineStop]:
    """
    Load line stops from txt tile and return the list of line stop data.
    """
    df = pd.read_csv(
        STOPS_FILE,
        usecols=["trip_id", "stop_id", "stop_sequence"],
        dtype={"trip_id": str, "stop_id": int, "stop_sequence": int},
    )
    return [
        SPTransLineStop(
            trip_id=row["trip_id"],
            stop_id=row["stop_id"],
            stop_order=row["stop_sequence"],
        )
        for _, row in df.iterrows()
    ]


def create_line_stops(
    shapes_interval: int = 30,
    distance_tolerance: float = 0.3,
) -> None:
    """
    Create line stops from the static SPTrans data.

    ## Strategy to find closest point on the SPTrans shape
    Every line has a shape related to it where SPTrans files have the tracked points
    of a vehicle when following the route of the line and also the traveled distance
    until that point. For each stop of the line we would try to find the closest point
    to our stop in the shape. However, some lines might traverse the same point
    (or closed to it) in multiple times in a route. To calculate the correct
    distance we would compare the stop with a consecutive slice of the shape.
    The base size of this slice is controlled by the parameter `shapes_interval`.
    Every time we find a closest point for our target stop, the slice would move
    to the right.

    The parameter `distance_tolerance` will control how much of an error we are
    willing to accept when finding the closest point. If the error is bigger than
    the tolerance, the slice size will be temporarily increased by `shapes_interval`,
    until we find a better point.
    """
    sptrans_line_stops = load_line_stops()
    session = SessionLocal()

    trip_to_shape_map = load_trips()
    shape_cache = load_shapes()
    stop_rows = session.query(StopModel).all()
    stop_points = {
        s.id: Point(latitude=s.latitude, longitude=s.longitude) for s in stop_rows
    }

    existing_line_stop_ids: dict[tuple[int, int], UUID] = {
        (line_id, stop_order): line_stop_id
        for line_stop_id, line_id, stop_order in session.execute(
            select(
                LineStopModel.id,
                LineStopModel.line_id,
                LineStopModel.stop_order,
            )
        ).all()
    }
    existing_lines = session.query(LineModel).all()
    lines_by_trip_id: dict[str, LineModel] = {
        f"{line.name}-{SPTransLineDirection[line.direction].value - 1}": line
        for line in existing_lines
    }

    existing_stop_ids = set(session.execute(select(StopModel.id)).scalars().all())

    line_stops_to_create: list[LineStopModel] = []
    line_stops_to_update: list[dict] = []
    non_existing_lines: set[str] = set()
    non_existing_stops: set[int] = set()

    for sptrans_line_stop in progress_bar(sptrans_line_stops):
        trip_id = sptrans_line_stop.trip_id
        stop_id = sptrans_line_stop.stop_id
        stop_order = sptrans_line_stop.stop_order
        if trip_id not in lines_by_trip_id:
            if trip_id not in non_existing_lines:
                logger.warning(f"A linha {trip_id} não existe na base de dados")
                non_existing_lines.add(trip_id)
            continue

        line = lines_by_trip_id[trip_id]

        if stop_id not in existing_stop_ids:
            if stop_id not in non_existing_stops:
                logger.warning(f"A parada {stop_id} não existe na base de dados")
                non_existing_stops.add(stop_id)
            continue

        # ----------- calculates the actual distance ---------------------
        distance = 0.0

        shape_id = trip_to_shape_map.get(trip_id)

        if shape_id is None:
            logger.warning(f"A linha {trip_id} não tem shape")
        elif shape_id not in shape_cache:
            logger.warning(f"A linha {trip_id} tem uma shape {shape_id} sem dados")
        else:
            shape_points = shape_cache[shape_id]
            target_point = stop_points[stop_id]

            current_interval = shapes_interval
            closest = None
            while closest is None:
                closest = distance_service.find_closest_point(
                    shape_points[:current_interval], target_point
                )
                assert closest is not None
                error_distance = geodist(
                    closest.to_tuple(), target_point.to_tuple(), metric="km"
                )
                if (
                    current_interval < len(shape_points)
                    and error_distance > distance_tolerance
                ):
                    # Try again if we could still expand the interval
                    closest = None
                    current_interval += shapes_interval

            distance = closest.distance
            if error_distance > distance_tolerance:
                logger.warning(
                    f"O ponto escolhido para representar a parada {stop_id} com ordem "
                    f"{stop_order} para a linha {line.id} está a "
                    f"uma distância de {error_distance} km dela"
                )
            shape_cache[shape_id] = [
                point for point in shape_points if point.sequence >= closest.sequence
            ]

            if stop_order == 1:
                distance = 0

        line_stop = LineStopModel(
            line_id=line.id,
            stop_id=stop_id,
            stop_order=stop_order,
            distance_traveled=distance,
        )
        unique_constraint = (line.id, stop_order)
        if unique_constraint not in existing_line_stop_ids:
            line_stops_to_create.append(line_stop)
        else:
            line_stop.id = existing_line_stop_ids[unique_constraint]
            line_stops_to_update.append(line_stop.dict())

    logger.info(
        f"Criando {len(line_stops_to_create)} paradas-linha na base de dados..."
    )

    if len(line_stops_to_create) > 0:
        session.add_all(line_stops_to_create)
        session.commit()

    logging.info(
        f"Atualizando {len(line_stops_to_update)} paradas-linha na base de dados..."
    )
    if len(line_stops_to_update) > 0:
        session.execute(update(LineStopModel), line_stops_to_update)
        session.commit()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    create_line_stops(shapes_interval=30, distance_tolerance=0.35)
