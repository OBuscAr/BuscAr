from app.clients.sptrans_client import get_live_vehicles_positions

from tests.factories.schemas import SPTransLinesVehiclesResponseFactory
from tests.helpers import SPTransHelper


def test_response():
    """
    GIVEN  a list of vehicles to be returned by the SPTrans API
    WHEN   the `get_live_vehicles_positions` is called
    THEN   the related vehicles should be returned
    """
    # GIVEN
    expected_lines_vehicles = SPTransLinesVehiclesResponseFactory.build()
    endpoint_mock = SPTransHelper.mock_get_vehicles_positions(
        response=expected_lines_vehicles
    )

    # WHEN
    returned_lines_vehicles = get_live_vehicles_positions(
        credentials=SPTransHelper.COOKIE_JAR
    )

    # THEN
    assert returned_lines_vehicles == expected_lines_vehicles
    assert endpoint_mock.call_count == 1
