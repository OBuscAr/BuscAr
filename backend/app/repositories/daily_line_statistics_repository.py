import datetime
from typing import Optional

from sqlalchemy.orm import Query, Session

from app.models import DailyLineStatisticsModel


def get_daily_line_statistics(
    db: Session,
    date: Optional[datetime.date] = None,
    line_id: Optional[int] = None,
):
    """
    Return the daily line statistics of the given `date`, ordered by
    decreasing `distance_traveled`.
    """
    query = db.query(DailyLineStatisticsModel)
    if date is not None:
        query = query.filter_by(date=date)
    if line_id is not None:
        query = query.filter_by(line_id=line_id)
    return query


def get_ordered_daily_line_statistics(
    db: Session, date: Optional[datetime.date] = None
) -> Query[DailyLineStatisticsModel]:
    """
    Return the daily line statistics of the given `date`, ordered by
    decreasing `distance_traveled`.
    """
    return get_daily_line_statistics(db=db, date=date).order_by(
        DailyLineStatisticsModel.distance_traveled.desc()
    )
