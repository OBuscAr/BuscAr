from datetime import date
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Query, Session
from sqlalchemy.orm.query import RowReturningQuery

from app.models import DailyLineStatisticsModel


def get_daily_line_statistics(
    db: Session,
    line_id: Optional[int] = None,
    minimum_date: Optional[date] = None,
    maximum_date: Optional[date] = None,
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


def get_daily_statistics(
    db: Session,
    minimum_date: Optional[date] = None,
    maximum_date: Optional[date] = None,
) -> RowReturningQuery[tuple[date, float]]:
    """
    Return the accumulated daily statistics along all the lines grouped and ordered
    by date.

    Filter parameters (will be ignored if they are None):
    - `minimum_date`: Filter objects that have date greater than or equal to
      the given date.
    - `maximum_date`: Filter objects that have date less than or equal to
      the given date.
    """
    query = (
        get_daily_line_statistics(
            db=db,
            minimum_date=minimum_date,
            maximum_date=maximum_date,
        )
        .with_entities(
            DailyLineStatisticsModel.date,
            func.sum(DailyLineStatisticsModel.distance_traveled),
        )
        .group_by(DailyLineStatisticsModel.date)
        .order_by(DailyLineStatisticsModel.date)
    )

    return query


def get_ordered_daily_line_statistics(
    db: Session, date: Optional[date] = None
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
