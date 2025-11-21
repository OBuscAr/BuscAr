import datetime
from typing import Optional

from sqlalchemy.orm import Query, Session

from app.models import DailyLineStatisticsModel


def get_daily_line_statistics(
    db: Session,
    line_id: Optional[int] = None,
    minimum_date: Optional[datetime.date] = None,
    maximum_date: Optional[datetime.date] = None,
) -> Query[DailyLineStatisticsModel]:
    """
    Return the daily line statistics.

    Filter parameters (will be ignored if they are None):
    - `line_id`: Filter by the given line.
    - `minimum_date`: Filter objects that have date greater than or equal to
      the given date.
    - `maximum_date`: Filter objects that have date less than or equal to
      the given date.
    """
    query = db.query(DailyLineStatisticsModel)
    if minimum_date is not None:
        query = query.filter(DailyLineStatisticsModel.date >= minimum_date)
    if maximum_date is not None:
        query = query.filter(DailyLineStatisticsModel.date <= maximum_date)
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
    return get_daily_line_statistics(
        db=db,
        minimum_date=date,
        maximum_date=date,
    ).order_by(DailyLineStatisticsModel.distance_traveled.desc())
