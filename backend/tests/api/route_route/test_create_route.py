from app.schemas import Route
from fastapi import status
from fastapi.testclient import TestClient

from tests.factories.models import (
    LineFactory,
    LineStopFactory,
    StopFactory,
    UserFactory,
)
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import LoginHelper, MyclimateHelper

ENDPOINT_URL = "/routes"


def test_successful_response(client: TestClient):
    """
    GIVEN  existing user, line, stops, line_stops and a test client
    WHEN   the POST `/routes` endpoint is called
    THEN   a response with status `HTTP_201_CREATED` should be returned
    """
    # GIVEN
    user = UserFactory.create_sync()
    LoginHelper.mock_current_user(user=user)
    line = LineFactory.create_sync()
    departure_stop = StopFactory.create_sync()
    arrival_stop = StopFactory.create_sync()
    for stop in [departure_stop, arrival_stop]:
        LineStopFactory.create_sync(line=line, stop=stop)
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=None,
        response=MyclimateCarbonEmissionFactory.build(),
    )
    params = {
        "line_id": line.id,
        "departure_stop_id": departure_stop.id,
        "arrival_stop_id": arrival_stop.id,
    }

    # WHEN
    response = client.post(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_201_CREATED
    Route(**response.json())


def test_not_found(client: TestClient):
    """
    GIVEN  a line without the given stop
    WHEN   the POST `/routes` endpoint is called
    THEN   a response with status `HTTP_404_NOT_FOUND` should be returned
    """
    # GIVEN
    params = {"line_id": 1, "departure_stop_id": 10, "arrival_stop_id": 20}

    # WHEN
    response = client.post(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_my_climate_error(client: TestClient):
    """
    GIVEN  existing line, stops, line_stops and a test client
    WHEN   the `/emissions` endpoint is called and MyClimate raises an exception
    THEN   the endpoint should catch the exception and return
           a response with status `HTTP_503_SERVICE_UNAVAILABLE`
    """
    # GIVEN
    MyclimateHelper.mock_carbon_emission_error()
    line = LineFactory.create_sync()
    departure_stop = StopFactory.create_sync()
    arrival_stop = StopFactory.create_sync()
    for stop in [departure_stop, arrival_stop]:
        LineStopFactory.create_sync(line=line, stop=stop)
    params = {
        "line_id": line.id,
        "departure_stop_id": departure_stop.id,
        "arrival_stop_id": arrival_stop.id,
    }

    # WHEN
    response = client.post(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
