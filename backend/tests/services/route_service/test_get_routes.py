from app.core.database import SessionLocal
from app.services.route_service import get_routes

from tests.factories.models import UserFactory, UserRouteFactory


def test_conversion():
    """
    GIVEN  some user routes in database
    WHEN   the `get_routes` function is called
    THEN   the queryset should be correctly transform to pydantic class
    """
    # GIVEN
    session = SessionLocal()
    n_user_routes = 7
    user = UserFactory.create_sync()
    UserRouteFactory.create_batch_sync(size=n_user_routes, user=user)

    # WHEN
    returned_user_routes = get_routes(db=session, user_id=user.id)

    # THEN
    assert len(returned_user_routes) == n_user_routes
