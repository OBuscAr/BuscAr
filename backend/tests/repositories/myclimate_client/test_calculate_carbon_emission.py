import random

import pytest
from app.exceptions import MyclimateError
from app.repositories.myclimate_client import calculate_carbon_emission
from app.schemas import VehicleType

from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper


@pytest.mark.parametrize("vehicle_type", list(VehicleType))
def test_response(vehicle_type: VehicleType):
    """
    GIVEN  a carbon emission response to be returned by the Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   the related response should be returned
    """
    # GIVEN
    expected_emission = MyclimateCarbonEmissionFactory.build()
    distance = 5
    endpoint_mock = MyclimateHelper.mock_carbon_emission(
        response=expected_emission,
        distance=distance,
        vehicle_type=vehicle_type,
    )

    # WHEN
    returned_emission = calculate_carbon_emission(
        distance=distance, vehicle_type=vehicle_type
    )

    # THEN
    assert returned_emission == expected_emission.emission
    assert endpoint_mock.call_count == 1


def test_smaller_distances():
    """
    GIVEN  a distance less than 1 to be sent to Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   the funciton should return 0 without calling Myclimate
    """
    # GIVEN
    vehicle_type = random.choice(list(VehicleType))
    endpoint_mock = MyclimateHelper.mock_carbon_emission_error()

    # WHEN
    returned_emission = calculate_carbon_emission(distance=0, vehicle_type=vehicle_type)

    # THEN
    assert returned_emission == 0
    assert endpoint_mock.call_count == 0


def test_error():
    """
    GIVEN  a carbon emission error to be returned by the Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   a `MyclimateError` should be raised
    """
    # GIVEN
    endpoint_mock = MyclimateHelper.mock_carbon_emission_error()

    # WHEN
    # THEN
    with pytest.raises(MyclimateError):
        calculate_carbon_emission(distance=3, vehicle_type=VehicleType.BUS)
    assert endpoint_mock.call_count > 0
