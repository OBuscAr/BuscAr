from app.core.database import SessionLocal
from app.models import UserRouteModel
from app.repositories.user_route_repository import (
    delete_user_route,
)

from tests.factories.models import UserRouteFactory


def test_delete_user_route():
    """
    GIVEN  a target user route
    WHEN   the `delete_user_route` function is called
    THEN   the user route should be deleted
    """
    # GIVEN
    session = SessionLocal()
    UserRouteFactory.__session__ = session
    user_route = UserRouteFactory.create_sync()

    # WHEN
    delete_user_route(db=session, user_route=user_route)

    # THEN
    assert session.query(UserRouteModel).count() == 0
