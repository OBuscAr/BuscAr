import pytest
from app.commands.update_line_statistics import update_vehicle_positions
from app.core.database import SessionLocal
from app.models import VehicleModel

from tests.factories.models import LineFactory
from tests.factories.schemas import (
    SPTransLineVehiclesResponseFactory,
    SPTransVehicleFactory,
)


@pytest.mark.parametrize("num_vehicles_to_create", [1, 2])
def test_create_vehicles(num_vehicles_to_create: int):
    """
    GIVEN  a line in database and some vehicles to create
    WHEN   the `update_vehicle_positions` is called
    THEN   new vehicles should be created
    """
    # GIVEN
    session = SessionLocal()
    LineFactory.__session__ = session
    line = LineFactory.create_sync()
    vehicles = SPTransVehicleFactory.batch(size=num_vehicles_to_create)
    line_vehicles = [
        SPTransLineVehiclesResponseFactory.build(line_id=line.id, vehicles=vehicles)
    ]

    # WHEN
    update_vehicle_positions(lines_vehicles=line_vehicles)

    # THEN
    session = SessionLocal()
    assert session.query(VehicleModel).count() == num_vehicles_to_create

    for vehicle in vehicles:
        db_line = session.query(VehicleModel).filter_by(id=vehicle.id).one()
        assert db_line.latitude == vehicle.latitude
        assert db_line.longitude == vehicle.longitude
        assert db_line.updated_at == vehicle.updated_at


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
