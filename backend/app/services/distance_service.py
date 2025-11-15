from typing import Dict, List, Tuple

from app.models.line_stop import LineStop
from sqlalchemy.orm import Session


def calculate_distance_between_stops(
    db: Session, line_id: int, stop_a_id: int, stop_b_id: int
) -> float:
    """
    Calculates the actual distance (in kilometers) between two stops on the same line,
    using the accumulated distance (distance_traveled) saved in the database.

    distance = |dist(stopB) - dist(stopA)|
    """

    stop_a = (
        db.query(LineStop)
        .filter(LineStop.line_id == line_id, LineStop.stop_id == stop_a_id)
        .first()
    )

    stop_b = (
        db.query(LineStop)
        .filter(LineStop.line_id == line_id, LineStop.stop_id == stop_b_id)
        .first()
    )

    if not stop_a or not stop_b:
        raise ValueError("Uma das paradas não pertence à linha especificada.")

    # distância real em quilômetros
    return abs(stop_b.distance_traveled - stop_a.distance_traveled)


def find_closest_shape_point(
    shape_points: List[Dict], stop_coords: Tuple[float, float]
):
    """
    Find the nearest point on the shape of that stop.
    """
    stop_lat, stop_lon = stop_coords
    best = None
    best_dist = float("inf")

    for p in shape_points:
        d = (p["lat"] - stop_lat) ** 2 + (p["lon"] - stop_lon) ** 2
        if d < best_dist:
            best_dist = d
            best = p

    return best
