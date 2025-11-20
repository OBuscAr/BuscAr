from datetime import date

from app.schemas import LinesEmissionsResponse
from fastapi import status
from fastapi.testclient import TestClient

from tests.factories.models import DailyLineStatisticsFactory

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
    params = {"date": target_date, "page": 2, "page_size": 3}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK
    LinesEmissionsResponse(**response.json())  # validate schema
