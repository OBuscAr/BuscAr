from datetime import date, datetime, timedelta

from app.constants import SAO_PAULO_ZONE
from app.schemas import EmissionStatisticsReponse
from fastapi import status
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from tests.factories.models import DailyLineStatisticsFactory, LineFactory
from tests.helpers import MyclimateHelper

ENDPOINT_URL = "/emissions/lines/{line_id}/statistics"


def test_successful_response(client: TestClient):
    """
    GIVEN  a valid start date and some daily line statistics in database
    WHEN   the `/emissions/lines/{line_id/statistics` endpoint is called
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
    MyclimateHelper.mock_simplified_bulk_carbon_emission()
    params = {"start_date": start_date, "days_range": 10}

    # WHEN
    response = client.get(ENDPOINT_URL.format(line_id=line.id), params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK
    # validate response schema
    emissions = TypeAdapter(list[EmissionStatisticsReponse]).validate_python(
        response.json()
    )
    assert len(emissions) > 0


def test_invalid_date(client: TestClient):
    """
    GIVEN  an start date in the future
    WHEN   the `/emissions/lines/{line_id}/statistics` endpoint is called
    THEN   a response with status `HTTP_422_UNPROCESSABLE_CONTENT` should be returned
    """
    # GIVEN
    today = datetime.now(tz=SAO_PAULO_ZONE).date()

    MyclimateHelper.mock_carbon_emission_error()
    params = {"start_date": today + timedelta(days=1), "days_range": 1}

    # WHEN
    response = client.get(ENDPOINT_URL.format(line_id=1), params=params)

    # THEN
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_myclimate_error(client: TestClient):
    """
    GIVEN  an error of Myclimate API
    WHEN   the `/emissions/lines/{line_id}/statistics` endpoint is called
    THEN   a response with status `HTTP_503_SERVICE_UNAVAILABLE` should be returned
    """
    # GIVEN
    start_date = date(year=2025, month=7, day=15)
    line = LineFactory.create_sync()
    DailyLineStatisticsFactory.create_sync(
        line=line,
        date=start_date,
    )
    MyclimateHelper.mock_bulk_carbon_emission_exception(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE
    )
    params = {"start_date": start_date, "days_range": 1}

    # WHEN
    response = client.get(ENDPOINT_URL.format(line_id=line.id), params=params)

    # THEN
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
