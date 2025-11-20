import random

import pytest
from app.repositories.myclimate_client import bulk_calculate_carbon_emission
from app.schemas import VehicleType

from tests.factories.schemas import MyclimateBulkCarbonEmissionFactory
from tests.helpers import MyclimateHelper


@pytest.mark.parametrize("vehicle_type", list(VehicleType))
def test_response(vehicle_type: VehicleType):
    """
    GIVEN  a bulk carbon emission response to be returned by the Myclimate API
    WHEN   the `bulk_calculate_carbon_emission` is called
    THEN   the related response should be returned
    """
    # GIVEN
    expected_emission = MyclimateBulkCarbonEmissionFactory.build()
    distances = [random.uniform(0, 10) for _ in range(7)]
    endpoint_mock = MyclimateHelper.mock_bulk_carbon_emission(
        response=expected_emission,
        distances=distances,
        vehicle_type=vehicle_type,
    )

    # WHEN
    returned_emission = bulk_calculate_carbon_emission(
        distances=distances, vehicle_type=vehicle_type
    )

    # THEN
    assert returned_emission == [trip.emission for trip in expected_emission.trips]
    assert endpoint_mock.call_count == 1
