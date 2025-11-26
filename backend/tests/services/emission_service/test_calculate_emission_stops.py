import math

from app.core.database import SessionLocal
from app.schemas import VehicleType
from app.services.emission_service import (
    AVERAGE_PASSENGERS_PER_BUS,
    calculate_emission_stops,
)

from tests.factories.models import LineFactory, LineStopFactory
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper


def test_car_emission():
    """
    GIVEN  a vehicle type CAR
    WHEN   the `calculate_emission_stops` function is called
    THEN   the emission for the actual distance should be returned
    """
    # GIVEN
    session = SessionLocal()
    vehicle_type = VehicleType.CAR
    line = LineFactory.create_sync()
    first_line_stop = LineStopFactory.create_sync(
        line=line, distance_traveled=0, stop_order=1
    )
    second_line_stop = LineStopFactory.create_sync(
        line=line, distance_traveled=10, stop_order=2
    )
    emission_response = MyclimateCarbonEmissionFactory.build()
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=vehicle_type,
        response=emission_response,
    )

    # WHEN
    result = calculate_emission_stops(
        db=session,
        vehicle_type=vehicle_type,
        line_id=line.id,
        stop_id_a=first_line_stop.stop_id,
        stop_id_b=second_line_stop.stop_id,
    )

    # THEN
    assert math.isclose(
        result.emission_kg_co2, emission_response.emission, abs_tol=1e-2
    )


def test_bus_emission():
    """
    GIVEN  a vehicle type BUS
    WHEN   the `calculate_emission_stops` function is called
    THEN   the emission for distance should be divided by `AVERAGE_PASSENGERS_PER_BUS`
    """
    # GIVEN
    session = SessionLocal()
    vehicle_type = VehicleType.BUS
    line = LineFactory.create_sync()
    first_line_stop = LineStopFactory.create_sync(
        line=line, distance_traveled=0, stop_order=1
    )
    second_line_stop = LineStopFactory.create_sync(
        line=line, distance_traveled=10, stop_order=2
    )
    emission_response = MyclimateCarbonEmissionFactory.build()
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=vehicle_type,
        response=emission_response,
    )

    # WHEN
    result = calculate_emission_stops(
        db=session,
        vehicle_type=vehicle_type,
        line_id=line.id,
        stop_id_a=first_line_stop.stop_id,
        stop_id_b=second_line_stop.stop_id,
    )

    # THEN
    assert math.isclose(
        result.emission_kg_co2,
        emission_response.emission / AVERAGE_PASSENGERS_PER_BUS,
        abs_tol=1e-2,
    )
