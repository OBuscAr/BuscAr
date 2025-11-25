from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

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
    def get_first_line_stop(
        db: Session,
        line_id: int,
        stop_id: int,
        minimum_stop_order: Optional[int] = None,
    ) -> Optional[LineStop]:
        """
        Get the line_stop for the given line and stop. In case of multiple
        options, return the one with lowest `stop_order`.

        - If `minimum_stop_order` is not null, only consider the results that
          have stop order greater than or equal to the given value.
        """
        query = db.query(LineStop).filter_by(line_id=line_id, stop_id=stop_id)

        if minimum_stop_order is not None:
            query = query.filter(LineStop.stop_order >= minimum_stop_order)

        return query.order_by(LineStop.stop_order).first()
