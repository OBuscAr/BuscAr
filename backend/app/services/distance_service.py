from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.repositories.line_stop_repository import LineStopRepository
from app.schemas import SPTransShape


def calculate_distance_between_stops(
    db: Session, line_id: int, stop_a_id: int, stop_b_id: int
) -> float:
    """
    Calculates the actual distance (in kilometers) between two stops on the same line,
    using the accumulated distance (distance_traveled) saved in the database.

    distance = |dist(stopB) - dist(stopA)|
    """

    stop_a = LineStopRepository.get_first_line_stop(
        db=db, line_id=line_id, stop_id=stop_a_id
    )
    if stop_a is None:
        raise NotFoundError(f"A parada {stop_a_id} não pertence à linha {line_id}")

    stop_b = LineStopRepository.get_first_line_stop(
        db=db, line_id=line_id, stop_id=stop_b_id
    )
    if stop_b is None:
        raise NotFoundError(f"A parada {stop_a_id} não pertence à linha {line_id}")

    # distância real em quilômetros
    return abs(stop_b.distance_traveled - stop_a.distance_traveled)


def find_closest_shape_point(
    shape_points: list[SPTransShape], stop_coords: Tuple[float, float]
) -> Optional[SPTransShape]:
    """
    Find the nearest point on the shape of that stop.
    """
    stop_lat, stop_lon = stop_coords
    best = None
    best_dist = float("inf")

    for p in shape_points:
        d = (p.latitude - stop_lat) ** 2 + (p.longitude - stop_lon) ** 2
        if d < best_dist:
            best_dist = d
            best = p

    return best
