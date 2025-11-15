from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.line import LineDirection
from app.services.distance_service import calculate_distance_between_stops
from app.repositories.line_repository import LineRepository
from app.repositories.line_stop_repository import LineStopRepository


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
    def get_nearest_stop(db: Session, line_id: int, lat: float, lon: float):
        stops = LineStopRepository.get_stops_for_line(db, line_id)

        return DistanceService.find_closest_stop(stops, lat, lon)

