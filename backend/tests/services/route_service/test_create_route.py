import pytest
from app.core.database import SessionLocal
from app.exceptions import NotFoundError
from app.models import UserRouteModel
from app.schemas import EmissionResponse, VehicleType
from app.services.emission_service import calculate_emission_stops
from app.services.route_service import create_route
from pytest_mock import MockerFixture

from tests.factories.models import LineFactory, StopFactory, UserFactory

EMISSION_SERVICE = (
    f"{calculate_emission_stops.__module__}.{calculate_emission_stops.__name__}"
)


def test_create_route(mocker: MockerFixture):
    """
    GIVEN  an existing user, line and stops and data to create a route
    WHEN   the `create_route` function is called
    THEN   the user route should be created
    """
    # GIVEN
    session = SessionLocal()
    user = UserFactory.create_sync()
    line = LineFactory.create_sync()
    departure_stop = StopFactory.create_sync()
    arrival_stop = StopFactory.create_sync()

    distance = 10
    bus_emission = 6
    car_emission = 4

    def side_effect(vehicle_type: VehicleType, **kwargs) -> EmissionResponse:
        if vehicle_type == VehicleType.BUS:
            return EmissionResponse(distance_km=distance, emission_kg_co2=bus_emission)
        else:
            return EmissionResponse(distance_km=distance, emission_kg_co2=car_emission)

    mocked = mocker.patch(EMISSION_SERVICE)
    mocked.side_effect = side_effect

    # WHEN
    returned_route = create_route(
        db=session,
        user_id=user.id,
        line_id=line.id,
        departure_stop_id=departure_stop.id,
        arrival_stop_id=arrival_stop.id,
    )

    # THEN
    assert mocked.call_count == 2
    assert session.query(UserRouteModel).count() == 1
    assert returned_route.distance == distance
    assert returned_route.emission == bus_emission
    assert returned_route.emission_saving == car_emission - bus_emission


def test_non_existing_line():
    """
    GIVEN  a non existing line to create a route
    WHEN   the `create_route` function is called
    THEN   a `NotFoundError` should be raised and no user route
           should be created
    """
    # GIVEN
    session = SessionLocal()
    user = UserFactory.create_sync()
    departure_stop = StopFactory.create_sync()
    arrival_stop = StopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(NotFoundError):
        create_route(
            db=session,
            user_id=user.id,
            line_id=0,
            departure_stop_id=departure_stop.id,
            arrival_stop_id=arrival_stop.id,
        )

    assert session.query(UserRouteModel).count() == 0


def test_non_existing_departure_stop():
    """
    GIVEN  a non existing departure stop to create a route
    WHEN   the `create_route` function is called
    THEN   a `NotFoundError` should be raised and no user route
           should be created
    """
    # GIVEN
    session = SessionLocal()
    user = UserFactory.create_sync()
    line = LineFactory.create_sync()
    arrival_stop = StopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(NotFoundError):
        create_route(
            db=session,
            user_id=user.id,
            line_id=line.id,
            departure_stop_id=0,
            arrival_stop_id=arrival_stop.id,
        )

    assert session.query(UserRouteModel).count() == 0


def test_non_existing_arrival_stop():
    """
    GIVEN  a non existing arrival stop to create a route
    WHEN   the `create_route` function is called
    THEN   a `NotFoundError` should be raised and no user route
           should be created
    """
    # GIVEN
    session = SessionLocal()
    user = UserFactory.create_sync()
    line = LineFactory.create_sync()
    departure_stop = StopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(NotFoundError):
        create_route(
            db=session,
            user_id=user.id,
            line_id=line.id,
            departure_stop_id=departure_stop.id,
            arrival_stop_id=0,
        )

    assert session.query(UserRouteModel).count() == 0
