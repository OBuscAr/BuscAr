import math
from datetime import date, datetime, timedelta

import pytest
import sqlalchemy
from app.constants import SAO_PAULO_ZONE
from app.core.database import SessionLocal
from app.exceptions import ValidationError
from app.repositories.daily_line_statistics_repository import get_daily_statistics
from app.services.emission_service import get_emission_statistics
from pytest_mock import MockerFixture

from tests.factories.models import DailyLineStatisticsFactory
from tests.helpers import MyclimateHelper

REPOSITORY_FUNCTION = (
    f"{get_daily_statistics.__module__}.{get_daily_statistics.__name__}"
)


def test_invalid_start_date():
    """
    GIVEN  a `start_date` in the future
    WHEN   the `get_emission_statistics` function is called
    THEN   a `ValidationError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    today = datetime.now(tz=SAO_PAULO_ZONE).date()

    # WHEN
    # THEN
    with pytest.raises(ValidationError):
        get_emission_statistics(
            db=session,
            start_date=today + timedelta(days=1),
            days_range=1,
        )


@pytest.mark.parametrize(
    "start_date, days_range, expected_end_date",
    [
        (date(year=2025, month=10, day=15), 3, date(year=2025, month=10, day=17)),
        (date(year=2025, month=10, day=31), 1, date(year=2025, month=10, day=31)),
    ],
)
def test_date_range_conversion(
    mocker: MockerFixture,
    start_date: date,
    days_range: int,
    expected_end_date: date,
):
    """
    GIVEN  a `start_date` and `days_range`
    WHEN   the `get_emission_statistics` function is called
    THEN   the correct date range is sent to the repository function
    """
    # GIVEN
    session = SessionLocal()
    mocked = mocker.patch(
        REPOSITORY_FUNCTION,
        return_value=session.query(sqlalchemy.false()).filter(sqlalchemy.false()),
        # empty query
    )

    # WHEN
    get_emission_statistics(
        db=session,
        start_date=start_date,
        days_range=days_range,
    )

    # THEN
    mocked.assert_called_with(
        minimum_date=start_date,
        maximum_date=expected_end_date,
        db=session,
    )


def test_emission():
    """
    GIVEN  a daily line statistics in database
    WHEN   the `get_emission_statistics` function is called
    THEN   the distance should be transformed to carbon emission
    """
    # GIVEN
    session = SessionLocal()
    target_date = date(year=2025, month=11, day=20)
    daily_line_statistics = DailyLineStatisticsFactory.create_sync(date=target_date)
    expected_emission = 6
    MyclimateHelper.mock_simplified_bulk_carbon_emission_by_value(
        emission_response=expected_emission,
    )

    # WHEN
    results = get_emission_statistics(
        db=session,
        start_date=target_date,
        days_range=1,
    )

    # THEN
    assert len(results) == 1
    [returned_line_emission] = results
    assert math.isclose(
        returned_line_emission.total_emission, expected_emission, abs_tol=1e-2
    )
    assert math.isclose(
        returned_line_emission.total_distance,
        daily_line_statistics.distance_traveled,
        abs_tol=1e-2,
    )
