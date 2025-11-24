import math
from datetime import timedelta

from app.commands.update_daily_line_statistics import (
    MAXIMUM_ELAPSED_TIME_TO_UPDATE,
    update_vehicle_positions,
)
from app.core.database import SessionLocal
from app.models import VehicleModel
from geodistpy import geodist

from tests.factories.models import LineFactory, VehicleFactory
from tests.factories.schemas import (
    SPTransLineVehiclesResponseFactory,
    SPTransVehicleFactory,
)


def test_create_vehicles():
    """
    GIVEN  a line in database and some vehicles to create
    WHEN   the `update_vehicle_positions` is called
    THEN   new vehicles should be created and the method should return
           an empty dict
    """
    # GIVEN
    num_vehicles_to_create = 2
    session = SessionLocal()
    line = LineFactory.create_sync()
    vehicles = SPTransVehicleFactory.batch(size=num_vehicles_to_create)
    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(line_id=line.id, vehicles=vehicles)
    ]

    # WHEN
    returned_response = update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    session = SessionLocal()
    assert session.query(VehicleModel).count() == num_vehicles_to_create

    for vehicle in vehicles:
        db_vehicle = session.query(VehicleModel).filter_by(id=vehicle.id).one()
        assert db_vehicle.latitude == vehicle.latitude
        assert db_vehicle.longitude == vehicle.longitude
        assert db_vehicle.updated_at == vehicle.updated_at
        assert db_vehicle.line_id == line.id

    assert returned_response == {}


def test_vehicles_without_existing_line():
    """
    GIVEN  some vehicles to create related to a non existing line
    WHEN   the `update_vehicle_positions` is called
    THEN   no vehicles should be created
    """
    # GIVEN
    vehicles = SPTransVehicleFactory.batch(size=1)
    line_vehicles = [SPTransLineVehiclesResponseFactory.build(vehicles=vehicles)]

    # WHEN
    update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    session = SessionLocal()
    assert session.query(VehicleModel).count() == 0


def test_duplicate_vehicle_same_line():
    """
    GIVEN  a duplicate vehicle for a single line
    WHEN   the `update_vehicle_positions` is called
    THEN   the first vehicle should be created and the other duplicates should
           be ignored
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    target_vehicle = SPTransVehicleFactory.build()
    duplicate_vehicles = SPTransVehicleFactory.batch(size=3, id=target_vehicle.id)
    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=line.id, vehicles=[target_vehicle] + duplicate_vehicles
        )
    ]

    # WHEN
    update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    assert session.query(VehicleModel).count() == 1
    db_vehicle = session.query(VehicleModel).filter_by(id=target_vehicle.id).one()
    assert db_vehicle.latitude == target_vehicle.latitude
    assert db_vehicle.longitude == target_vehicle.longitude
    assert db_vehicle.updated_at == target_vehicle.updated_at


def test_duplicate_vehicle_different_lines():
    """
    GIVEN  a duplicate vehicle for a different lines
    WHEN   the `update_vehicle_positions` is called
    THEN   the vehicle for the first line should be created and
           the other duplicates should be ignored
    """
    # GIVEN
    session = SessionLocal()
    first_line = LineFactory.create_sync()
    other_lines = LineFactory.create_batch_sync(size=2)
    target_vehicle = SPTransVehicleFactory.build()

    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=first_line.id, vehicles=[target_vehicle]
        )
    ] + [
        SPTransLineVehiclesResponseFactory.build(
            line_id=line.id,
            vehicles=[target_vehicle],
        )
        for line in other_lines
    ]

    # WHEN
    update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    assert session.query(VehicleModel).count() == 1
    db_vehicle = session.query(VehicleModel).filter_by(id=target_vehicle.id).one()
    assert db_vehicle.line_id == first_line.id


def test_update_vehicles_and_return_distance():
    """
    GIVEN  some vehicles in database to be updated and new vehicles data
           with near `updated_at` and with the same line as the database data
    WHEN   the `update_vehicle_positions` is called
    THEN   the vehicles should be updated and the method should return
           the difference in distance
    """
    # GIVEN
    session = SessionLocal()

    first_line = LineFactory.create_sync()
    first_line_old_vehicles = VehicleFactory.create_batch_sync(
        size=2, line_id=first_line.id
    )
    first_line_new_vehicles = [
        SPTransVehicleFactory.build(
            id=vehicle.id,
            updated_at=vehicle.updated_at + timedelta(minutes=3),
        )
        for vehicle in first_line_old_vehicles
    ]

    first_line_expected_distance = 0
    for old_vehicle, new_vehicle in zip(
        first_line_old_vehicles, first_line_new_vehicles, strict=True
    ):
        first_line_expected_distance += geodist(
            (old_vehicle.latitude, old_vehicle.longitude),
            (new_vehicle.latitude, new_vehicle.longitude),
            metric="km",
        )

    second_line = LineFactory.create_sync()
    second_line_old_vehicles = VehicleFactory.create_batch_sync(
        size=3, line_id=second_line.id
    )
    second_line_new_vehicles = [
        SPTransVehicleFactory.build(
            id=vehicle.id,
            updated_at=vehicle.updated_at + timedelta(minutes=3),
        )
        for vehicle in second_line_old_vehicles
    ]

    second_line_expected_distance = 0
    for old_vehicle, new_vehicle in zip(
        second_line_old_vehicles, second_line_new_vehicles, strict=True
    ):
        second_line_expected_distance += geodist(
            (old_vehicle.latitude, old_vehicle.longitude),
            (new_vehicle.latitude, new_vehicle.longitude),
            metric="km",
        )

    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=first_line.id,
            vehicles=first_line_new_vehicles,
        )
    ] + [
        SPTransLineVehiclesResponseFactory.build(
            line_id=second_line.id,
            vehicles=second_line_new_vehicles,
        )
    ]

    # WHEN
    returned_response = update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    session = SessionLocal()
    assert session.query(VehicleModel).count() == len(first_line_old_vehicles) + len(
        second_line_old_vehicles
    )

    for vehicle in first_line_new_vehicles + second_line_new_vehicles:
        db_vehicle = session.query(VehicleModel).filter_by(id=vehicle.id).one()
        assert db_vehicle.latitude == vehicle.latitude
        assert db_vehicle.longitude == vehicle.longitude
        assert db_vehicle.updated_at == vehicle.updated_at

    assert len(returned_response) == 2

    assert math.isclose(
        returned_response[first_line.id],
        first_line_expected_distance,
        abs_tol=1e-3,
    )
    assert math.isclose(
        returned_response[second_line.id],
        second_line_expected_distance,
        abs_tol=1e-3,
    )


def test_update_vehicles_with_same_updated_at():
    """
    GIVEN  a vehicle in database to be updated with new vehicles data
           with same `updated_at`
    WHEN   the `update_vehicle_positions` is called
    THEN   the method should return an empty dict
    """
    # GIVEN
    line = LineFactory.create_sync()
    vehicle = VehicleFactory.create_sync(line_id=line.id)

    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=line.id,
            vehicles=[
                SPTransVehicleFactory.build(
                    id=vehicle.id,
                    updated_at=vehicle.updated_at,
                )
            ],
        )
    ]

    # WHEN
    returned_response = update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    assert returned_response == {}


def test_maximum_elapsed_time_to_update():
    """
    GIVEN  a vehicle in database to be updated with new vehicles data
           with an `updated_at` that is too far from the old one
    WHEN   the `update_vehicle_positions` is called
    THEN   the vehicle should be updated but the method should return an empty dict
    """
    # GIVEN
    line = LineFactory.create_sync()
    vehicle = VehicleFactory.create_sync(line_id=line.id)

    new_vehicle = SPTransVehicleFactory.build(
        id=vehicle.id,
        updated_at=vehicle.updated_at
        + MAXIMUM_ELAPSED_TIME_TO_UPDATE
        + timedelta(minutes=1),
    )
    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=line.id,
            vehicles=[new_vehicle],
        )
    ]

    # WHEN
    returned_response = update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    assert returned_response == {}

    session = SessionLocal()
    db_vehicle = session.query(VehicleModel).filter_by(id=vehicle.id).one()
    assert db_vehicle.latitude == new_vehicle.latitude
    assert db_vehicle.longitude == new_vehicle.longitude
    assert db_vehicle.updated_at == new_vehicle.updated_at


def test_update_vehicle_different_line():
    """
    GIVEN  a vehicle in database to be updated with new vehicles data
           with a different line
    WHEN   the `update_vehicle_positions` is called
    THEN   the vehicle should be updated but the method should return an empty dict
    """
    # GIVEN
    old_line = LineFactory.create_sync()
    vehicle = VehicleFactory.create_sync(line_id=old_line.id)
    new_vehicle = SPTransVehicleFactory.build(
        id=vehicle.id,
        updated_at=vehicle.updated_at + timedelta(minutes=1),
    )

    new_line = LineFactory.create_sync()
    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(
            line_id=new_line.id,
            vehicles=[new_vehicle],
        )
    ]

    # WHEN
    returned_response = update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    assert returned_response == {}

    session = SessionLocal()
    db_vehicle = session.query(VehicleModel).filter_by(id=vehicle.id).one()
    assert db_vehicle.latitude == new_vehicle.latitude
    assert db_vehicle.longitude == new_vehicle.longitude
    assert db_vehicle.updated_at == new_vehicle.updated_at
    assert db_vehicle.line_id == new_line.id
