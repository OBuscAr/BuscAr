from typing import Optional, TypeVar, cast

import numpy
from geodistpy import geodist
from numpy.typing import NDArray
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.repositories import stop_repository
from app.repositories.line_repository import LineRepository
from app.repositories.line_stop_repository import LineStopRepository
from app.schemas import Point


def calculate_distance_between_stops(
    db: Session, line_id: int, stop_a_id: int, stop_b_id: int
) -> float:
    """
    Calculates the actual distance (in kilometers) between two stops on the same line,
    using the accumulated distance (distance_traveled) saved in the database.

    distance = dist(stopB) - dist(stopA)
    """
    line = LineRepository.get_line(db=db, line_id=line_id)
    stop_a = stop_repository.get_stop(db=db, stop_id=stop_a_id)
    stop_b = stop_repository.get_stop(db=db, stop_id=stop_b_id)
    line_stop_a = LineStopRepository.get_first_line_stop(
        db=db, line_id=line_id, stop_id=stop_a_id
    )
    if line_stop_a is None:
        raise NotFoundError(f"A parada {stop_a.name} não pertence à linha {line.name}")

    line_stop_b = LineStopRepository.get_first_line_stop(
        db=db,
        line_id=line_id,
        stop_id=stop_b_id,
        minimum_stop_order=line_stop_a.stop_order,
    )
    if line_stop_b is None:
        raise NotFoundError(
            f"A parada {stop_b.name} não está depois da parada {stop_a.name} "
            f"na linha {line.name}"
        )

    # distância real em quilômetros
    return line_stop_b.distance_traveled - line_stop_a.distance_traveled


T = TypeVar("T", bound=Point)


def find_closest_point(points: list[T], target_point: Point) -> Optional[T]:
    """
    Find the nearest point to `target_point` from the list of `points`.
    """
    if len(points) == 0:
        return None
    elif len(points) == 1:
        return points[0]

    distances = cast(
        NDArray[numpy.float64],
        geodist(
            [point.to_tuple() for point in points],
            [target_point.to_tuple()] * len(points),
            metric="km",
        ),
    )
    return points[numpy.argmin(distances)]
