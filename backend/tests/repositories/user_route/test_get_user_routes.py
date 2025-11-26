from app.core.database import SessionLocal
from app.repositories.user_route_repository import (
    get_user_routes,
)

from tests.factories.models import UserFactory, UserRouteFactory


def test_user_filter():
    """
    GIVEN  a target user and two routes, one from the target user and one from other
    WHEN   the `get_user_routes` function is called
    THEN   only the user route from the target user should be returned
    """
    # GIVEN
    session = SessionLocal()
    target_user = UserFactory.create_sync()
    expected_user_route = UserRouteFactory.create_sync(user=target_user)

    other_user = UserFactory.create_sync()
    UserRouteFactory.create_sync(user=other_user)

    # WHEN
    results = get_user_routes(db=session, user_id=target_user.id).all()

    # THEN
    assert len(results) == 1
    [returned_user_route] = results
    assert returned_user_route.id == expected_user_route.id


def test_creation_order():
    """
    GIVEN  some user routes
    WHEN   the `get_user_routes` function is called
    THEN   the results should be ordered by decreasing `created_at`
    """
    # GIVEN
    session = SessionLocal()
    target_user = UserFactory.create_sync()
    n_user_routes = 7
    UserRouteFactory.create_batch_sync(size=n_user_routes, user=target_user)

    # WHEN
    results = get_user_routes(db=session, user_id=target_user.id).all()

    # THEN
    assert len(results) == n_user_routes
    assert all(
        results[i].created_at >= results[i + 1].created_at
        for i in range(len(results) - 1)
    )
