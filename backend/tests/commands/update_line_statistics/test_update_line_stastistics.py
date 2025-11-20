import math
from datetime import datetime
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
    update_daily_line_statistics()

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
