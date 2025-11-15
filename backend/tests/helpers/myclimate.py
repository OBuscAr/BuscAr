import responses
from app.repositories.myclimate_client import BUS_FUEL_CONSUMPTION, CARBON_EMISSION_URL
from app.schemas import MyclimateCarbonEmission, VehicleType
from fastapi import status
from responses import BaseResponse, matchers


class MyclimateHelper:
    """
    Helper to mock external calls to Myclimate API.
    """

    @staticmethod
    def mock_carbon_emission(
        distance: float, vehicle_type: VehicleType, response: MyclimateCarbonEmission
    ) -> BaseResponse:
        """
        Mock the carbon emission endpoint.
        """
        expected_body = {"fuel_type": "diesel", "km": distance}
        if vehicle_type == VehicleType.BUS:
            expected_body = expected_body | {"fuel_consumption": BUS_FUEL_CONSUMPTION}
        else:
            expected_body = expected_body | {"car_type": "small"}

        return responses.post(
            CARBON_EMISSION_URL,
            status=status.HTTP_200_OK,
            match=[matchers.json_params_matcher(expected_body)],
            json=response.model_dump(by_alias=True),
        )
