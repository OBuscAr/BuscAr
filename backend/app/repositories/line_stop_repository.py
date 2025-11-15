from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.stop import Stop
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

