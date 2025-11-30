import math
from datetime import date

import pytest
from app.core.database import SessionLocal
from app.schemas import MyclimateBulkCarbonEmission, VehicleType
from app.services.emission_service import get_emission_lines_ranking

from tests.factories.models import DailyLineStatisticsFactory
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper


@pytest.mark.parametrize(
    "num_objects, page, page_size, expected_range, expected_page_count",
    [
        (7, 3, 2, (4, 6), 4),
        (6, 1, 3, (0, 3), 2),
        (5, 3, 4, (1, 0), 2),  # empty range
    ],
)
def test_pagination(
    num_objects: int,
    page: int,
    page_size: int,
    expected_range: tuple[int, int],
    expected_page_count: int,
):
    """
    GIVEN  some daily line statistics in database and a target date
    WHEN   the `get_emission_lines_ranking` function is called
    THEN   the results should be paginated
    """
    # GIVEN
    session = SessionLocal()
    target_date = date(year=2025, month=11, day=20)
    daily_lines_statistics = DailyLineStatisticsFactory.create_batch_sync(
        size=num_objects,
        date=target_date,
    )
    daily_lines_statistics.sort(key=lambda x: x.distance_traveled, reverse=True)
    expected_lines = [stats.line_id for stats in daily_lines_statistics][
        slice(*expected_range)
    ]
    MyclimateHelper.mock_bulk_carbon_emission(
        distances=None,
        vehicle_type=None,
        response=MyclimateBulkCarbonEmission(
            trips=MyclimateCarbonEmissionFactory.batch(size=len(expected_lines))
        ),
    )

    # WHEN
    results = get_emission_lines_ranking(
        db=session,
        date=target_date,
        page=page,
        page_size=page_size,
    )

    # THEN
    returned_lines = [result.line.id for result in results.lines_emissions]
    assert returned_lines == expected_lines

    assert results.pagination.total_count == num_objects
    assert results.pagination.page_count == expected_page_count


def test_emission():
    """
    GIVEN  a daily line statistics in database and a target date
    WHEN   the `get_emission_lines_ranking` function is called
    THEN   the distance should be transformed to carbon emission
    """
    # GIVEN
    session = SessionLocal()
    target_date = date(year=2025, month=11, day=20)
    daily_line_statistics = DailyLineStatisticsFactory.create_sync(date=target_date)
    emission_response = MyclimateCarbonEmissionFactory.build()
    MyclimateHelper.mock_bulk_carbon_emission(
        distances=[daily_line_statistics.distance_traveled],
        vehicle_type=VehicleType.BUS,
        response=MyclimateBulkCarbonEmission(trips=[emission_response]),
    )

    # WHEN
    results = get_emission_lines_ranking(
        db=session,
        date=target_date,
        page=1,
        page_size=1,
    )

    # THEN
    assert len(results.lines_emissions) == 1
    [returned_line_emission] = results.lines_emissions
    assert math.isclose(
        returned_line_emission.emission, emission_response.emission, abs_tol=1e-2
    )
    assert math.isclose(
        returned_line_emission.distance,
        daily_line_statistics.distance_traveled,
        abs_tol=1e-2,
    )
