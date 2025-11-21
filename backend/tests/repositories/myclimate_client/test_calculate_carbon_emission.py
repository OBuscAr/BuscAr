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
    assert endpoint_mock.call_count == 1
