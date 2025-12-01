from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models import UserRouteModel
from app.repositories.user_route_repository import create_user_route

from tests.factories.models import LineFactory, StopFactory, UserFactory


def test_create_user_route():
    """
    GIVEN  an existing user, existing line, existing stop and new user_route data
    WHEN   the `create_user_route` function is called
    THEN   a user route should be created and returned
    """
    # GIVEN
    session = SessionLocal()
    user = UserFactory.create_sync()
    line = LineFactory.create_sync()
    stop = StopFactory.create_sync()
    user_route_data = UserRouteModel(
        user_id=user.id,
        line_id=line.id,
        departure_stop_id=stop.id,
        arrival_stop_id=stop.id,
        distance=0,
        emission=0,
        emission_saving=0,
    )

    # WHEN
    returned_user_route = create_user_route(
        user_route=user_route_data,
        db=session,
    )

    # THEN
    assert session.query(UserRouteModel).count() == 1
    assert datetime.now(tz=timezone.utc) - returned_user_route.created_at <= timedelta(
        seconds=30
    )
