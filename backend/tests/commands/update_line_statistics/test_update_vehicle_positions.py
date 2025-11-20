from app.commands.update_line_statistics import update_vehicle_positions
from app.core.database import SessionLocal
from app.models import VehicleModel

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
        db_line = session.query(VehicleModel).filter_by(id=vehicle.id).one()
        assert db_line.latitude == vehicle.latitude
        assert db_line.longitude == vehicle.longitude
        assert db_line.updated_at == vehicle.updated_at
        assert db_line.line_id == line.id

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
    db_line = session.query(VehicleModel).filter_by(id=target_vehicle.id).one()
    assert db_line.latitude == target_vehicle.latitude
    assert db_line.longitude == target_vehicle.longitude
    assert db_line.updated_at == target_vehicle.updated_at


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
    db_line = session.query(VehicleModel).filter_by(id=target_vehicle.id).one()
    assert db_line.line_id == first_line.id
