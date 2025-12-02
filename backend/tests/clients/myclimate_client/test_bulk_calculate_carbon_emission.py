import math
import random

import pytest
from app.exceptions import MyclimateError
from app.clients.myclimate_client import (
    MAXIMUM_ACCEPTED_DISTANCE,
    MINIMUM_ACCEPTED_DISTANCE,
    bulk_calculate_carbon_emission,
)
from app.schemas import VehicleType
from fastapi import status

from tests.factories.schemas import (
    MyclimateBulkCarbonEmissionFactory,
    MyclimateCarbonEmissionFactory,
)
from tests.helpers import MyclimateHelper


@pytest.mark.parametrize("vehicle_type", list(VehicleType))
def test_response(vehicle_type: VehicleType):
    """
    GIVEN  a bulk carbon emission response to be returned by the Myclimate API
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   the related response should be returned
    """
    # GIVEN
    num_distances = 3
    distances = [random.uniform(1, 10) for _ in range(num_distances)]
    expected_emission = MyclimateBulkCarbonEmissionFactory.build(
        trips=MyclimateCarbonEmissionFactory.batch(size=num_distances)
    )

    endpoint_mock = MyclimateHelper.mock_bulk_carbon_emission(
        response=expected_emission,
        distances=distances,
        vehicle_type=vehicle_type,
    )

    # WHEN
    returned_emissions = bulk_calculate_carbon_emission(
        distances=distances, vehicle_type=vehicle_type
    )

    # THEN
    assert endpoint_mock.call_count == 1
    expected_emission.trips.sort(key=lambda e: e.id)
    assert returned_emissions == [trip.emission for trip in expected_emission.trips]


def test_minimum_distance():
    """
    GIVEN  a distance less than 1
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   the related response should be 0
    """
    # GIVEN
    endpoint_mock = MyclimateHelper.mock_simplified_bulk_carbon_emission_by_value(
        emission_response=6,
    )

    # WHEN
    returned_emission = bulk_calculate_carbon_emission(
        distances=[MINIMUM_ACCEPTED_DISTANCE - 1], vehicle_type=VehicleType.BUS
    )

    # THEN
    assert endpoint_mock.call_count == 1
    assert len(returned_emission) == 1
    return returned_emission[0] == 0


def test_maximum_distance():
    """
    GIVEN  a distance greater than maximum allowed to be sent to Myclimate API
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   the function should make a call to the API with the maximum allowed distance
    """
    # GIVEN
    multiplier = 3.3
    distance = multiplier * MAXIMUM_ACCEPTED_DISTANCE
    raw_emission = 6
    endpoint_mock = MyclimateHelper.mock_simplified_bulk_carbon_emission_by_value(
        emission_response=raw_emission,
    )

    # WHEN
    returned_emission = bulk_calculate_carbon_emission(
        distances=[distance], vehicle_type=VehicleType.BUS
    )

    # THEN
    assert endpoint_mock.call_count == 1
    assert len(returned_emission) == 1
    return returned_emission[0] == raw_emission * multiplier


def test_simplify_mock():
    """
    GIVEN  a bulk carbon emission response to be returned by the Myclimate API
           using a dynamic mock
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   the related response should be returned
    """
    # GIVEN
    num_distances = 7
    distances = [random.uniform(1, 10) for _ in range(num_distances)]

    multiplier = 3
    endpoint_mock = MyclimateHelper.mock_simplified_bulk_carbon_emission(
        multiplier=multiplier
    )

    # WHEN
    returned_emission = bulk_calculate_carbon_emission(
        distances=distances, vehicle_type=VehicleType.BUS
    )

    # THEN
    assert endpoint_mock.call_count == 1
    assert len(returned_emission) == len(distances)
    for distance, returned_emission in zip(distances, returned_emission):
        expected_emission = distance * multiplier
        assert math.isclose(returned_emission, expected_emission, abs_tol=1e-3)


def test_exception():
    """
    GIVEN  a carbon emission http exception to be returned by the Myclimate API
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   a `MyclimateError` should be raised
    """
    # GIVEN
    endpoint_mock = MyclimateHelper.mock_bulk_carbon_emission_exception(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE
    )

    # WHEN
    # THEN
    with pytest.raises(MyclimateError):
        bulk_calculate_carbon_emission(distances=[3], vehicle_type=VehicleType.BUS)
    assert endpoint_mock.call_count > 0
