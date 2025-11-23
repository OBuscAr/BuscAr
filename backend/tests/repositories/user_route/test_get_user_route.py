from uuid import uuid4

import pytest
from app.core.database import SessionLocal
from app.exceptions import NotFoundError
from app.repositories.user_route_repository import (
    get_user_route,
)

from tests.factories.models import UserRouteFactory


def test_get_user_route():
    """
    GIVEN  an existing user route
    WHEN   the `get_user_route` function is called
    THEN   the target user route should be returned
    """
    # GIVEN
    session = SessionLocal()
    user_route = UserRouteFactory.create_sync()
    UserRouteFactory.create_batch_sync(size=3)

    # WHEN
    returned_user_route = get_user_route(db=session, user_route_id=user_route.id)

    # THEN
    assert returned_user_route.id == user_route.id


def test_user_route_not_found():
    """
    GIVEN  no user route for the given id
    WHEN   the `get_user_route` function is called
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    UserRouteFactory.create_sync()
    non_existing_id = uuid4()

    # WHEN
    # THEN
    with pytest.raises(expected_exception=NotFoundError):
        get_user_route(db=session, user_route_id=non_existing_id)
