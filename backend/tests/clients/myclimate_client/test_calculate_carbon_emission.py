import math
import random

import pytest
from app.clients.myclimate_client import (
    MAXIMUM_ACCEPTED_DISTANCE,
    MINIMUM_ACCEPTED_DISTANCE,
    calculate_carbon_emission,
)
from app.exceptions import MyclimateError
from app.schemas import VehicleType
from fastapi import status

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
    assert endpoint_mock.call_count == 1
    assert returned_emission == expected_emission.emission


def test_smaller_distances():
    """
    GIVEN  a distance less than 1 to be sent to Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   the function should make a call to the API with the minimum allowed distance
    """
    # GIVEN
    response = MyclimateCarbonEmissionFactory.build()
    vehicle_type = random.choice(list(VehicleType))
    endpoint_mock = MyclimateHelper.mock_carbon_emission(
        distance=MINIMUM_ACCEPTED_DISTANCE, vehicle_type=vehicle_type, response=response
    )
    distance = MINIMUM_ACCEPTED_DISTANCE - 0.5
    expected_emission = response.emission * distance

    # WHEN
    returned_emission = calculate_carbon_emission(
        distance=distance, vehicle_type=vehicle_type
    )

    # THEN
    assert endpoint_mock.call_count == 1
    assert math.isclose(returned_emission, expected_emission, abs_tol=1e-2)


def test_bigger_distances():
    """
    GIVEN  a distance greater than maximum allowed to be sent to Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   the function should make a call to the API with the maximum allowed distance
    """
    # GIVEN
    multiplier = 3.3
    distance = multiplier * MAXIMUM_ACCEPTED_DISTANCE
    vehicle_type = random.choice(list(VehicleType))
    response = MyclimateCarbonEmissionFactory.build()
    endpoint_mock = MyclimateHelper.mock_carbon_emission(
        response=response,
        distance=MAXIMUM_ACCEPTED_DISTANCE,
        vehicle_type=vehicle_type,
    )

    # WHEN
    returned_emission = calculate_carbon_emission(
        distance=distance, vehicle_type=vehicle_type
    )

    # THEN
    assert endpoint_mock.call_count == 1
    assert math.isclose(
        returned_emission,
        response.emission * multiplier,
        abs_tol=1e-2,
    )


def test_json_error():
    """
    GIVEN  a carbon emission json error to be returned by the Myclimate API
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


def test_exception():
    """
    GIVEN  a carbon emission http exception to be returned by the Myclimate API
    WHEN   the `calculate_carbon_emission` is called
    THEN   a `MyclimateError` should be raised
    """
    # GIVEN
    endpoint_mock = MyclimateHelper.mock_carbon_emission_exception(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="",
    )

    # WHEN
    # THEN
    with pytest.raises(MyclimateError):
        calculate_carbon_emission(distance=3, vehicle_type=VehicleType.BUS)
    assert endpoint_mock.call_count > 0
