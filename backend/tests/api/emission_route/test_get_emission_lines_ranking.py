from datetime import date

from app.schemas import LinesEmissionsResponse, MyclimateBulkCarbonEmission
from fastapi import status
from fastapi.testclient import TestClient

from tests.factories.models import DailyLineStatisticsFactory
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper

ENDPOINT_URL = "/emissions/lines"


def test_successful_response(client: TestClient):
    """
    GIVEN  some daily line statistics in database
    WHEN   the `/emissions/lines` endpoint is called
    THEN   a response with status `HTTP_200_OK` should be returned
    """
    # GIVEN
    target_date = date(year=2025, month=11, day=20)
    n_objects = 5
    DailyLineStatisticsFactory.create_batch_sync(size=n_objects, date=target_date)
    MyclimateHelper.mock_bulk_carbon_emission(
        distances=None,
        vehicle_type=None,
        response=MyclimateBulkCarbonEmission(
            trips=MyclimateCarbonEmissionFactory.batch(size=n_objects)
        ),
    )
    params = {"date": target_date, "page": 1, "page_size": n_objects}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK

    lines_emissions = LinesEmissionsResponse(**response.json()).lines_emissions
    assert len(lines_emissions) > 0
