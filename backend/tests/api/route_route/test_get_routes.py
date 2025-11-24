from app.schemas import Route
from fastapi import status
from fastapi.testclient import TestClient
from pydantic import TypeAdapter

from tests.factories.models import (
    UserFactory,
    UserRouteFactory,
)
from tests.helpers import LoginHelper

ENDPOINT_URL = "/routes"


def test_successful_response(client: TestClient):
    """
    GIVEN  some user routes
    WHEN   the GET `/routes` endpoint is called
    THEN   a response with status `HTTP_200_OK` should be returned
    """
    # GIVEN
    user = UserFactory.create_sync()
    LoginHelper.mock_current_user(user=user)
    UserRouteFactory.create_batch_sync(size=7, user=user)

    # WHEN
    response = client.get(ENDPOINT_URL)

    # THEN
    assert response.status_code == status.HTTP_200_OK
    # validate response schema
    routes = TypeAdapter(list[Route]).validate_python(response.json())
    assert len(routes) > 0
