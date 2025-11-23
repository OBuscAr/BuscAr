import csv
import os
from typing import Optional

import pandas as pd
from sqlalchemy import select
from tqdm import tqdm as progress_bar

from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import LineModel, LineStopModel, StopModel
from app.schemas import SPTransLineDirection, SPTransShape
from app.services import distance_service

SHAPES_FILE = os.path.join(SPTRANS_DATA_PATH, "shapes.txt")
TRIPS_FILE = os.path.join(SPTRANS_DATA_PATH, "trips.txt")
STOPS_FILE = os.path.join(SPTRANS_DATA_PATH, "stop_times.txt")


def load_trips(max_rows: Optional[int] = None) -> dict[str, str]:
    mapping: dict[str, str] = {}
    with open(TRIPS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for index, row in enumerate(reader):
            if max_rows is not None and index > max_rows:
                break
            route_id = row["route_id"].strip()
            if route_id not in mapping:
                mapping[route_id] = row["shape_id"]
    return mapping


def load_shapes(max_rows: Optional[int] = None) -> dict[str, list[SPTransShape]]:
    shapes: dict[str, list[SPTransShape]] = {}
    with open(SHAPES_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for index, row in enumerate(reader):
            if max_rows is not None and index > max_rows:
                break
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


def create_line_stops(max_rows: Optional[int] = None) -> None:
    """
    Create line stops from the static SPTrans data.
    """
    df = pd.read_csv(
        STOPS_FILE,
        usecols=["trip_id", "stop_id", "stop_sequence"],
        dtype={"trip_id": str, "stop_id": int, "stop_sequence": int},
        nrows=max_rows,
    )

    session = SessionLocal()

    line_to_shape_map = load_trips(max_rows=max_rows)
    shape_cache = load_shapes(max_rows=max_rows)

    stop_rows = session.query(StopModel).all()
    stop_coords = {s.id: (s.latitude, s.longitude) for s in stop_rows}

    existing_line_stop_ids = set(
        session.execute(select(LineStopModel.line_id, LineStopModel.stop_id)).all()
    )
    existing_lines = session.query(LineModel).all()
    lines_by_name_direction: dict[str, int] = {
        f"{line.name}-{SPTransLineDirection[line.direction].value - 1}": line.id
        for line in existing_lines
    }

    existing_stop_ids = set(session.execute(select(StopModel.id)).scalars().all())

    line_stops_to_create: list[LineStopModel] = []
    non_existing_lines: set[str] = set()
    non_existing_stops: set[int] = set()
    bar = progress_bar(total=df.shape[0])
    for _, row in df.iterrows():
        bar.update(1)
        line_name_direction: str = row["trip_id"]
        stop_id: int = row["stop_id"]
        stop_order: int = row["stop_sequence"]

        if line_name_direction not in lines_by_name_direction:
            if line_name_direction not in non_existing_lines:
                print(f"Linha {line_name_direction} não existe na base de dados")
                non_existing_lines.add(line_name_direction)
            continue

        line_id = lines_by_name_direction[line_name_direction]

        if stop_id not in existing_stop_ids:
            if stop_id not in non_existing_stops:
                print(f"Parada {stop_id} não existe na base de dados")
                non_existing_stops.add(stop_id)
            continue

        # ----------- calculates the actual distance ---------------------
        dist_km = 0.0

        line_name = "-".join(line_name_direction.split("-")[:-1])  # ex: "8000-10"

        shape_id = line_to_shape_map.get(line_name)

        if shape_id and shape_id in shape_cache:
            shape_points = shape_cache[shape_id]
            coords = stop_coords.get(stop_id)

            if coords and coords[0] is not None:
                closest = distance_service.find_closest_shape_point(
                    shape_points, coords
                )
                if closest is not None:
                    dist_km = closest.distance / 1000.0

        line_stop = LineStopModel(
            line_id=line_id,
            stop_id=stop_id,
            stop_order=stop_order,
            distance_traveled=dist_km,
        )
        if (line_id, stop_id) not in existing_line_stop_ids:
            line_stops_to_create.append(line_stop)

    print(f"Criando {len(line_stops_to_create)} paradas-linha na base de dados...")

    if len(line_stops_to_create) > 0:
        session.add_all(line_stops_to_create)
        session.commit()


if __name__ == "__main__":
    create_line_stops()
