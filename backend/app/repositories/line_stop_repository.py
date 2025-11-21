from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import StopModel
from app.models.line_stop import LineStop


class LineStopRepository:

    @staticmethod
    def get_stops_for_line(db: Session, line_id: int):
        query = (
            select(StopModel)
            .join(LineStop, StopModel.id == LineStop.stop_id)
            .where(LineStop.line_id == line_id)
            .order_by(LineStop.stop_order)
        )
        return db.execute(query).scalars().all()

    @staticmethod
    def get_line_stop(db: Session, line_id: int, stop_id: int) -> LineStop:
        """
        Get the line_stop for the given line and stop.
        If the line stop does not exist, an exception will be raised.
        """
        try:
            return (
                db.query(LineStop)
                .filter(LineStop.line_id == line_id, LineStop.stop_id == stop_id)
                .one()
            )
        except NoResultFound:
            raise NotFoundError(f"A parada {stop_id} não pertence à linha {line_id}")
