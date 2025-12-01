from uuid import uuid4

from fastapi import status
from fastapi.testclient import TestClient

from tests.factories.models import (
    UserFactory,
    UserRouteFactory,
)
from tests.helpers import LoginHelper

ENDPOINT_URL = "/routes/{route_id}"


def test_successful_response(client: TestClient):
    """
    GIVEN  a user route
    WHEN   the DELETE `/routes/{route_id}` endpoint is called
    THEN   a response with status `HTTP_204_NO_CONTENT` should be returned
    """
    # GIVEN
    user = UserFactory.create_sync()
    LoginHelper.mock_current_user(user=user)
    user_route = UserRouteFactory.create_sync(user=user)

    # WHEN
    response = client.delete(ENDPOINT_URL.format(route_id=user_route.id))

    # THEN
    assert response.status_code == status.HTTP_204_NO_CONTENT


def test_user_route_not_found(client: TestClient):
    """
    GIVEN  no user routes
    WHEN   the DELETE `/routes/{route_id}` endpoint is called
    THEN   a response with status `HTTP_404_NOT_FOUND` should be returned
    """
    # GIVEN
    user = UserFactory.create_sync()
    LoginHelper.mock_current_user(user=user)

    # WHEN
    response = client.delete(ENDPOINT_URL.format(route_id=uuid4()))

    # THEN
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_forbidden_user_route(client: TestClient):
    """
    GIVEN  a user route from another user to delete
    WHEN   the DELETE `/routes/{route_id}` endpoint is called
    THEN   a response with status `HTTP_403_FORBIDDEN` should be returned
    """
    # GIVEN
    user = UserFactory.create_sync()
    LoginHelper.mock_current_user(user=user)
    other_user = UserFactory.create_sync()
    user_route = UserRouteFactory.create_sync(user=other_user)

    # WHEN
    response = client.delete(ENDPOINT_URL.format(route_id=user_route.id))

    # THEN
    assert response.status_code == status.HTTP_403_FORBIDDEN
