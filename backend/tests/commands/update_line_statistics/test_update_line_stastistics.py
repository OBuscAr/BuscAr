import math
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.commands.update_daily_line_statistics import (
    update_daily_line_statistics,
    update_vehicle_positions,
)
from app.core.database import SessionLocal
from app.models import DailyLineStatisticsModel
from pytest_mock import MockerFixture

from tests.factories.models import (
    DailyLineStatisticsFactory,
    LineFactory,
)
from tests.factories.schemas import SPTransLinesVehiclesResponseFactory
from tests.helpers import SPTransHelper

SAO_PAULO = ZoneInfo("America/Sao_Paulo")

UPDATE_VEHICLE_POSITIONS_NAME = (
    f"{update_vehicle_positions.__module__}.{update_vehicle_positions.__name__}"
)


def test_create_daily_line_statistics_different_line(mocker: MockerFixture):
    """
    GIVEN  a daily line statistics in database and new SPTrans data for
           a different line
    WHEN   the `update_daily_line_statistics` is called
    THEN   a daily line statistics should be created for the new line
    """
    # GIVEN
    session = SessionLocal()
    other_line = LineFactory.create_sync()
    today = datetime.now(tz=SAO_PAULO).date()
    DailyLineStatisticsFactory.create_sync(line_id=other_line.id, date=today)

    target_line = LineFactory.create_sync()
    expected_distance = 3
    mock = mocker.patch(
        UPDATE_VEHICLE_POSITIONS_NAME,
        return_value={target_line.id: expected_distance},
    )

    SPTransHelper.mock_get_vehicles_positions(
        response=SPTransLinesVehiclesResponseFactory.build()
    )

    # WHEN
    update_daily_line_statistics(credentials=SPTransHelper.COOKIE_JAR)

    # THEN
    mock.assert_called()
    session = SessionLocal()
    assert session.query(DailyLineStatisticsModel).count() == 2

    db_daily_line_statistic = (
        session.query(DailyLineStatisticsModel).filter_by(line_id=target_line.id).one()
    )
    assert db_daily_line_statistic.date == today
    assert math.isclose(
        db_daily_line_statistic.distance_traveled, expected_distance, abs_tol=1e-3
    )


def test_create_daily_line_statistics_different_date(mocker: MockerFixture):
    """
    GIVEN  a daily line statistics in database and new SPTrans data for
           a different date
    WHEN   the `update_daily_line_statistics` is called
    THEN   a daily line statistics should be created for the new date
    """
    # GIVEN
    session = SessionLocal()
    other_date = datetime.now(tz=SAO_PAULO).date() - timedelta(days=3)
    today = datetime.now(tz=SAO_PAULO).date()
    target_line = LineFactory.create_sync()
    DailyLineStatisticsFactory.create_sync(line_id=target_line.id, date=other_date)

    expected_distance = 3
    mock = mocker.patch(
        UPDATE_VEHICLE_POSITIONS_NAME,
        return_value={target_line.id: expected_distance},
    )

    SPTransHelper.mock_get_vehicles_positions(
        response=SPTransLinesVehiclesResponseFactory.build()
    )

    # WHEN
    update_daily_line_statistics(credentials=SPTransHelper.COOKIE_JAR)

    # THEN
    mock.assert_called()
    session = SessionLocal()
    assert session.query(DailyLineStatisticsModel).count() == 2

    db_daily_line_statistic = (
        session.query(DailyLineStatisticsModel).filter_by(date=today).one()
    )
    assert db_daily_line_statistic.line_id == target_line.id
    assert math.isclose(
        db_daily_line_statistic.distance_traveled, expected_distance, abs_tol=1e-3
    )


def test_update_existing_daily_line_statistics(mocker: MockerFixture):
    """
    GIVEN  a daily line statistics in database and new SPTrans data with the same
           line and date
    WHEN   the `update_daily_line_statistics` is called
    THEN   the daily line statistics should be updated
    """
    # GIVEN
    session = SessionLocal()
    today = datetime.now(tz=SAO_PAULO).date()
    target_line = LineFactory.create_sync()
    daily_line_statistic = DailyLineStatisticsFactory.create_sync(
        line_id=target_line.id, date=today
    )

    delta_distance = 3
    mock = mocker.patch(
        UPDATE_VEHICLE_POSITIONS_NAME,
        return_value={target_line.id: delta_distance},
    )
    expected_distance = daily_line_statistic.distance_traveled + delta_distance

    SPTransHelper.mock_get_vehicles_positions(
        response=SPTransLinesVehiclesResponseFactory.build()
    )

    # WHEN
    update_daily_line_statistics(credentials=SPTransHelper.COOKIE_JAR)

    # THEN
    mock.assert_called()
    session = SessionLocal()
    assert session.query(DailyLineStatisticsModel).count() == 1

    db_daily_line_statistic = session.query(DailyLineStatisticsModel).one()
    assert db_daily_line_statistic.line_id == target_line.id
    assert db_daily_line_statistic.date == today
    assert math.isclose(
        db_daily_line_statistic.distance_traveled, expected_distance, abs_tol=1e-3
    )
