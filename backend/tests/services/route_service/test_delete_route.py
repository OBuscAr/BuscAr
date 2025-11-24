import pytest
from app.core.database import SessionLocal
from app.exceptions import ForbiddenError
from app.models import UserRouteModel
from app.services.route_service import delete_route

from tests.factories.models import UserFactory, UserRouteFactory


def test_deletion():
    """
    GIVEN  a user route from the correct user
    WHEN   the `delete_route` function is called
    THEN   the user route should be deleted
    """
    # GIVEN
    session = SessionLocal()
    UserFactory.__session__ = UserRouteFactory.__session__ = session
    user_route = UserRouteFactory.create_sync()

    # WHEN
    delete_route(db=session, user_id=user_route.user_id, route_id=user_route.id)

    # THEN
    assert session.query(UserRouteModel).count() == 0


def test_forbidden_deletion():
    """
    GIVEN  a user route from a different user
    WHEN   the `delete_route` function is called
    THEN   a `ForbiddenError` should be raised and no route should
           be deleted
    """
    # GIVEN
    session = SessionLocal()
    UserFactory.__session__ = UserRouteFactory.__session__ = session
    user_route = UserRouteFactory.create_sync()
    other_user = UserFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(expected_exception=ForbiddenError):
        delete_route(db=session, user_id=other_user.id, route_id=user_route.id)

    assert session.query(UserRouteModel).count() == 1
