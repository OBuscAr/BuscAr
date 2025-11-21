from app.core.database import SessionLocal
from app.repositories.daily_line_statistics_repository import (
    get_ordered_daily_line_statistics,
)

from tests.factories.models import DailyLineStatisticsFactory


def test_order():
    """
    GIVEN  some daily line statistics in database
    WHEN   the `get_ordered_daily_line_statistics` function is called
    THEN   the results should be sorted by `distance_traveled`
    """
    # GIVEN
    session = SessionLocal()
    n_results = 7
    DailyLineStatisticsFactory.create_batch_sync(size=n_results)

    # WHEN
    results = get_ordered_daily_line_statistics(db=session).all()

    # THEN
    assert len(results) == n_results
    assert all(
        results[i].distance_traveled >= results[i + 1].distance_traveled
        for i in range(len(results) - 1)
    )
