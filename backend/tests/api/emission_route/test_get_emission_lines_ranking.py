from datetime import date

from app.schemas import LinesEmissionsResponse
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
    DailyLineStatisticsFactory.create_batch_sync(size=5, date=target_date)
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=None,
        response=MyclimateCarbonEmissionFactory.build(),
    )
    params = {"date": str(target_date)}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK

    lines_emissions = LinesEmissionsResponse(**response.json()).lines_emissions
    assert len(lines_emissions) > 0


def test_myclimate_error(client: TestClient):
    """
    GIVEN  an error of Myclimate API
    WHEN   the `/emissions/lines` endpoint is called
    THEN   a response with status `HTTP_503_SERVICE_UNAVAILABLE` should be returned
    """
    # GIVEN
    target_date = date(year=2025, month=11, day=20)
    DailyLineStatisticsFactory.create_batch_sync(size=5, date=target_date)
    MyclimateHelper.mock_carbon_emission_error()
    params = {"date": str(target_date)}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
