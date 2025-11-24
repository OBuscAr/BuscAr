from typing import Optional

from pydantic import TypeAdapter
from sqlalchemy.orm import Session

from app.repositories.line_repository import LineRepository
from app.repositories.line_stop_repository import LineStopRepository
from app.schemas import Point, Stop
from app.services import distance_service


class LineService:

    @staticmethod
    def search_lines(db: Session, term: Optional[str]):
        return LineRepository.search(db, term)

    @staticmethod
    def get_stops_for_line(db: Session, line_id: int):
        return LineStopRepository.get_stops_for_line(db, line_id)

    @staticmethod
    def search_stops_by_line_term(db: Session, term: str, sentido: Optional[int]):
        line = LineRepository.find_by_term_and_direction(db, term, sentido)
        if not line:
            return None

        return LineStopRepository.get_stops_for_line(db, line.id)

    @staticmethod
    def get_nearest_stop(
        db: Session,
        line_id: int,
        lat: float,
        lon: float,
    ) -> Optional[Stop]:
        stops = LineStopRepository.get_stops_for_line(db, line_id)
        return distance_service.find_closest_point(
            TypeAdapter(list[Stop]).validate_python(stops),
            Point(latitude=lat, longitude=lon),
        )
