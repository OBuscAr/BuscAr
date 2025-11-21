from datetime import date, timedelta

from app.schemas import EmissionStatisticsReponse
from fastapi import status
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from tests.factories.models import DailyLineStatisticsFactory, LineFactory
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper

ENDPOINT_URL = "/emissions/lines/{line_id}/statistics"


def test_successful_response(client: TestClient):
    """
    GIVEN  a valid start date and some daily line statistics in database
    WHEN   the `/emissions/lines/{line_id}` endpoint is called
    THEN   a response with status `HTTP_200_OK` should be returned
    """
    # GIVEN
    start_date = date(year=2025, month=7, day=15)
    line = LineFactory.create_sync()
    for d in range(5):
        DailyLineStatisticsFactory.create_sync(
            line=line,
            date=start_date + timedelta(days=d),
        )
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=None,
        response=MyclimateCarbonEmissionFactory.build(),
    )
    params = {"start_date": start_date, "days_range": 2}

    # WHEN
    response = client.get(ENDPOINT_URL.format(line_id=line.id), params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK
    # validate response schema
    TypeAdapter(list[EmissionStatisticsReponse]).validate_python(response.json())
