import random
from datetime import date, timedelta

from app.core.database import SessionLocal
from app.repositories.daily_line_statistics_repository import (
    get_ordered_daily_line_statistics,
)

from tests.factories.models import DailyLineStatisticsFactory


def test_date_filter():
    """
    GIVEN  some daily line statistics in database and a target date
    WHEN   the `get_ordered_daily_line_statistics` function is called
    THEN   only daily line statistics of the target date should be returned
    """
    # GIVEN
    session = SessionLocal()
    target_date = date(year=2025, month=11, day=20)
    expected_daily_line_statistics = DailyLineStatisticsFactory.create_batch_sync(
        size=5, date=target_date
    )
    n_other_daily_line_statistics = 3
    for _ in range(n_other_daily_line_statistics):
        DailyLineStatisticsFactory.create_sync(
            date=target_date
            + timedelta(days=random.randint(1, 5) * random.choice([1, -1]))
        )

    # WHEN
    results = get_ordered_daily_line_statistics(date=target_date, db=session).all()

    # THEN
    assert sorted(
        [result.dict() for result in results], key=lambda r: (r["line_id"], r["date"])
    ) == sorted(
        [result.dict() for result in expected_daily_line_statistics],
        key=lambda r: (r["line_id"], r["date"]),
    )


def test_order():
    """
    GIVEN  some daily line statistics in database and a target date
    WHEN   the `get_ordered_daily_line_statistics` function is called
    THEN   the results should be sorted by `distance_traveled`
    """
    # GIVEN
    session = SessionLocal()
    target_date = date(year=2025, month=11, day=20)
    n_results = 7
    DailyLineStatisticsFactory.create_batch_sync(size=n_results, date=target_date)

    # WHEN
    results = get_ordered_daily_line_statistics(date=target_date, db=session).all()

    # THEN
    assert len(results) == n_results
    assert all(
        results[i].distance_traveled >= results[i + 1].distance_traveled
        for i in range(len(results) - 1)
    )
