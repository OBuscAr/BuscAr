import math
import random
from datetime import date, timedelta

from app.core.database import SessionLocal
from app.repositories.daily_line_statistics_repository import (
    get_daily_statistics,
)

from tests.factories.models import DailyLineStatisticsFactory


def test_sum():
    """
    GIVEN  some daily line statistics in database
    WHEN   the `get_daily_statistics` function is called
    THEN   the sum of distances for each date should be returned
    """
    # GIVEN
    session = SessionLocal()
    base_date = date(year=2025, month=11, day=20)

    expected_sums: dict[date, float] = {}
    for d in range(5):
        target_date = base_date + timedelta(days=d)
        statistics = DailyLineStatisticsFactory.create_batch_sync(
            size=random.randint(1, 7), date=target_date
        )
        expected_sums[target_date] = sum(
            [statistic.distance_traveled for statistic in statistics]
        )

    # WHEN
    results = get_daily_statistics(db=session).all()

    # THEN
    assert len(results) == len(expected_sums)
    for current_date, distance_sum in results:
        assert current_date in expected_sums
        assert math.isclose(distance_sum, expected_sums[current_date], abs_tol=1e-3)


def test_order():
    """
    GIVEN  some daily line statistics in database
    WHEN   the `get_daily_statistics` function is called
    THEN   the results should be ordered by date
    """
    # GIVEN
    session = SessionLocal()
    DailyLineStatisticsFactory.create_batch_sync(size=10)

    # WHEN
    results = get_daily_statistics(db=session).all()

    # THEN
    assert len(results) > 1
    assert all(results[i][0] <= results[i + 1][0] for i in range(len(results) - 1))
