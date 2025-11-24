import csv
import os

import pandas as pd
from sqlalchemy import select
from tqdm import tqdm as progress_bar

from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import LineModel, LineStopModel, StopModel
from app.schemas import Point, SPTransLineDirection, SPTransLineStop, SPTransShape
from app.services import distance_service

SHAPES_FILE = os.path.join(SPTRANS_DATA_PATH, "shapes.txt")
TRIPS_FILE = os.path.join(SPTRANS_DATA_PATH, "trips.txt")
STOPS_FILE = os.path.join(SPTRANS_DATA_PATH, "stop_times.txt")


def load_trips() -> dict[str, str]:
    mapping: dict[str, str] = {}
    with open(TRIPS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            route_id = row["route_id"].strip()
            if route_id not in mapping:
                mapping[route_id] = row["shape_id"]
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
                    distance=float(row["shape_dist_traveled"]),
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
            line_name_direction=row["trip_id"],
            stop_id=row["stop_id"],
            stop_order=row["stop_sequence"],
        )
        for _, row in df.iterrows()
    ]


def create_line_stops() -> None:
    """
    Create line stops from the static SPTrans data.
    """
    sptrans_line_stops = load_line_stops()
    session = SessionLocal()

    line_to_shape_map = load_trips()
    shape_cache = load_shapes()

    stop_rows = session.query(StopModel).all()
    stop_points = {
        s.id: Point(latitude=s.latitude, longitude=s.longitude) for s in stop_rows
    }

    existing_line_stop_ids = set(
        session.execute(select(LineStopModel.line_id, LineStopModel.stop_id)).all()
    )
    existing_lines = session.query(LineModel).all()
    lines_by_name_direction: dict[str, LineModel] = {
        f"{line.name}-{SPTransLineDirection[line.direction].value - 1}": line
        for line in existing_lines
    }

    existing_stop_ids = set(session.execute(select(StopModel.id)).scalars().all())

    line_stops_to_create: list[LineStopModel] = []
    non_existing_lines: set[str] = set()
    non_existing_stops: set[int] = set()
    for sptrans_line_stop in progress_bar(sptrans_line_stops):
        line_name_direction = sptrans_line_stop.line_name_direction
        stop_id = sptrans_line_stop.stop_id
        if line_name_direction not in lines_by_name_direction:
            if line_name_direction not in non_existing_lines:
                print(f"Linha {line_name_direction} não existe na base de dados")
                non_existing_lines.add(line_name_direction)
            continue

        line = lines_by_name_direction[line_name_direction]

        if stop_id not in existing_stop_ids:
            if stop_id not in non_existing_stops:
                print(f"Parada {stop_id} não existe na base de dados")
                non_existing_stops.add(stop_id)
            continue

        # ----------- calculates the actual distance ---------------------
        dist_km = 0.0

        shape_id = line_to_shape_map.get(line.name)

        if shape_id and shape_id in shape_cache:
            shape_points = shape_cache[shape_id]
            target_point = stop_points[stop_id]

            closest = distance_service.find_closest_point(shape_points, target_point)
            assert closest is not None
            dist_km = closest.distance / 1000.0

        line_stop = LineStopModel(
            line_id=line.id,
            stop_id=stop_id,
            stop_order=sptrans_line_stop.stop_order,
            distance_traveled=dist_km,
        )
        if (line.id, stop_id) not in existing_line_stop_ids:
            line_stops_to_create.append(line_stop)

    print(f"Criando {len(line_stops_to_create)} paradas-linha na base de dados...")

    if len(line_stops_to_create) > 0:
        session.add_all(line_stops_to_create)
        session.commit()


if __name__ == "__main__":
    create_line_stops()
