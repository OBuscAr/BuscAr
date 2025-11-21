import random
from datetime import date, timedelta

from app.core.database import SessionLocal
from app.repositories.daily_line_statistics_repository import (
    get_daily_line_statistics,
)

from tests.factories.models import DailyLineStatisticsFactory, LineFactory


def test_minimum_date_filter():
    """
    GIVEN  some daily line statistics in database and a target `minimum_date`
    WHEN   the `get_daily_line_statistics` function is called
    THEN   only daily line statistics with date greater than or equal to
           `minimum_date` should be returned
    """
    # GIVEN
    session = SessionLocal()
    minimum_date = date(year=2025, month=11, day=20)

    expected_daily_line_statistics = [
        DailyLineStatisticsFactory.create_sync(
            date=minimum_date + timedelta(days=random.randint(0, 5))
        )
        for _ in range(5)
    ]

    n_other_daily_line_statistics = 3
    for _ in range(n_other_daily_line_statistics):
        DailyLineStatisticsFactory.create_sync(
            date=minimum_date - timedelta(days=random.randint(1, 5))
        )

    # WHEN
    results = get_daily_line_statistics(minimum_date=minimum_date, db=session).all()

    # THEN
    assert sorted(
        [result.dict() for result in results], key=lambda r: (r["line_id"], r["date"])
    ) == sorted(
        [result.dict() for result in expected_daily_line_statistics],
        key=lambda r: (r["line_id"], r["date"]),
    )


def test_maximum_date_filter():
    """
    GIVEN  some daily line statistics in database and a target `maximum_date`
    WHEN   the `get_daily_line_statistics` function is called
    THEN   only daily line statistics with date smaller than or equal to
           `maximum_date` should be returned
    """
    # GIVEN
    session = SessionLocal()
    maximum_date = date(year=2025, month=11, day=20)

    expected_daily_line_statistics = [
        DailyLineStatisticsFactory.create_sync(
            date=maximum_date - timedelta(days=random.randint(0, 5))
        )
        for _ in range(5)
    ]

    n_other_daily_line_statistics = 3
    for _ in range(n_other_daily_line_statistics):
        DailyLineStatisticsFactory.create_sync(
            date=maximum_date + timedelta(days=random.randint(1, 5))
        )

    # WHEN
    results = get_daily_line_statistics(maximum_date=maximum_date, db=session).all()

    # THEN
    assert sorted(
        [result.dict() for result in results], key=lambda r: (r["line_id"], r["date"])
    ) == sorted(
        [result.dict() for result in expected_daily_line_statistics],
        key=lambda r: (r["line_id"], r["date"]),
    )


def test_line_filter():
    """
    GIVEN  some daily line statistics in database and a target line
    WHEN   the `get_daily_line_statistics` function is called
    THEN   only daily line statistics of the target line should be returned
    """
    # GIVEN
    session = SessionLocal()
    target_line = LineFactory.create_sync()
    expected_daily_line_statistics = DailyLineStatisticsFactory.create_batch_sync(
        size=5, line=target_line
    )
    n_other_daily_line_statistics = 3
    for _ in range(n_other_daily_line_statistics):
        DailyLineStatisticsFactory.create_sync(line=LineFactory.create_sync())

    # WHEN
    results = get_daily_line_statistics(line_id=target_line.id, db=session).all()

    # THEN
    assert sorted(
        [result.dict() for result in results], key=lambda r: (r["line_id"], r["date"])
    ) == sorted(
        [result.dict() for result in expected_daily_line_statistics],
        key=lambda r: (r["line_id"], r["date"]),
    )
