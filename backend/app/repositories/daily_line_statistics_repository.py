import datetime

from sqlalchemy.orm import Query, Session

from app.models import DailyLineStatisticsModel


def get_ordered_daily_line_statistics(
    date: datetime.date, db: Session
) -> Query[DailyLineStatisticsModel]:
    """
    Return the daily line statistics of the given `date`, ordered by
    decreasing `distance_traveled`.
    """
    return (
        db.query(DailyLineStatisticsModel)
        .filter_by(date=date)
        .order_by(DailyLineStatisticsModel.distance_traveled.desc())
    )
