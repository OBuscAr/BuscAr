from app.core.database import SessionLocal
from app.models import LineDirection, LineModel, LineStopModel, StopModel
from sqlalchemy import select
from tqdm import tqdm as progress_bar
from sqlalchemy import Float
from app.services import distance_service 

import csv
import os
from typing import Dict, List, Tuple

GTFS_PATH = "app/commands/sptrans_static_data/"
SHAPES_FILE = os.path.join(GTFS_PATH, "shapes.txt")
TRIPS_FILE = os.path.join(GTFS_PATH, "trips.txt")

FILE_LOCATION = "app/commands/sptrans_static_data/stop_times.txt"

def load_trips() -> Dict[int, str]:
    mapping = {}
    with open(TRIPS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            route_id = row["route_id"].strip()
            if route_id not in mapping:
                mapping[route_id] = row["shape_id"]
    return mapping
    
def load_shapes() -> Dict[str, List[Dict]]:
    shapes = {}
    with open(SHAPES_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            shape_id = row["shape_id"]
            entry = {
                "lat": float(row["shape_pt_lat"]),
                "lon": float(row["shape_pt_lon"]),
                "sequence": int(row["shape_pt_sequence"]),
                "dist": float(row["shape_dist_traveled"]) if row["shape_dist_traveled"] else None
            }
            shapes.setdefault(shape_id, []).append(entry)

    # ordenar
    for sid in shapes:
        shapes[sid].sort(key=lambda p: p["sequence"])

    return shapes

def create_line_stops() -> None:
    """
    Create line stops from the static SPTrans data.
    """
    with open(FILE_LOCATION, "r") as file:
        file_lines = file.readlines()

    session = SessionLocal()
    
    line_to_shape_map = load_trips()
    shape_cache = load_shapes()    
    
    stop_rows = session.query(StopModel).all()
    stop_coords = {s.id: (s.latitude, s.longitude) for s in stop_rows}    
    
    existing_line_stop_ids = set(
        session.execute(select(LineStopModel.line_id, LineStopModel.stop_id)).all()
    )
    existing_lines = session.query(LineModel).all()
    lines_by_name_direction: dict[str, str] = {
        f"{line.name}-{LineDirection(line.direction).value - 1}": line.id
        for line in existing_lines
    }

    existing_stop_ids = set(session.execute(select(StopModel.id)).scalars().all())

    line_stops_to_create: list[LineStopModel] = []
    non_existing_lines: set[str] = set()
    non_existing_stops: set[int] = set()
    for file_line in progress_bar(file_lines[1:]):  # Skip the first line
        file_line = file_line[:-1]  # ignore endline at the end
        line_name_direction, _, _, stop_id, stop_order = file_line.split(",")
        line_name_direction = line_name_direction.strip('"')

        if line_name_direction not in lines_by_name_direction:
            if line_name_direction not in non_existing_lines:
                print(f"Linha {line_name_direction} não existe na base de dados")
                non_existing_lines.add(line_name_direction)
            continue

        line_id = lines_by_name_direction[line_name_direction]
        stop_id = int(stop_id.strip('"'))
        stop_order = int(stop_order.strip('"'))

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
                closest = distance_service.find_closest_shape_point(shape_points, coords)
                if closest and closest["dist"] is not None:
                    dist_km = closest["dist"] / 1000.0
        
        
        line_stop = LineStopModel(
            line_id=line_id,
            stop_id=stop_id,
            stop_order=stop_order,
            distance_traveled=dist_km
        )
        if (line_id, stop_id) not in existing_line_stop_ids:
            line_stops_to_create.append(line_stop)

    print(f"Criando {len(line_stops_to_create)} paradas-linha na base de dados...")

    if len(line_stops_to_create) > 0:
        session.add_all(line_stops_to_create)
        session.commit()


if __name__ == "__main__":
    create_line_stops()
