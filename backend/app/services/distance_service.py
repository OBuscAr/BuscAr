from typing import Optional, TypeVar

from geopy import distance
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.repositories.line_stop_repository import LineStopRepository
from app.schemas import Point


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


T = TypeVar("T", bound=Point)


def find_closest_point(points: list[T], target_point: Point) -> Optional[T]:
    """
    Find the nearest point to `target_point` from the list of `points`.
    """
    if len(points) == 0:
        return None
    best = points[0]
    for p in points:
        if (
            distance.distance(
                (p.latitude, p.longitude),
                (target_point.latitude, target_point.longitude),
            ).kilometers
            < distance.distance(
                (best.latitude, best.longitude),
                (target_point.latitude, target_point.longitude),
            ).kilometers
        ):
            best = p

    return best
