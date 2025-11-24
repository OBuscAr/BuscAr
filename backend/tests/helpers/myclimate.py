from typing import Optional, Sequence

import responses
from app.repositories.myclimate_client import (
    BULK_CARBON_EMISSION_URL,
    BUS_FUEL_CONSUMPTION,
    CARBON_EMISSION_URL,
)
from app.schemas import (
    MyclimateBulkCarbonEmission,
    MyclimateCarbonEmission,
    VehicleType,
)
from fastapi import status
from responses import BaseResponse, matchers


class MyclimateHelper:
    """
    Helper to mock external calls to Myclimate API.
    """

    @staticmethod
    def mock_carbon_emission(
        distance: Optional[float],
        vehicle_type: Optional[VehicleType],
        response: MyclimateCarbonEmission,
    ) -> BaseResponse:
        """
        Mock the carbon emission endpoint. Null parameters won't be validated.
        """
        expected_body = {"fuel_type": "diesel"}
        if distance is not None:
            expected_body |= {"km": distance}
        if vehicle_type is not None:
            if vehicle_type == VehicleType.BUS:
                expected_body |= {"fuel_consumption": BUS_FUEL_CONSUMPTION}
            elif vehicle_type == VehicleType.CAR:
                expected_body |= {"car_type": "small"}
            else:
                raise NotImplementedError(f"Type {vehicle_type} not implemented")

        return responses.post(
            CARBON_EMISSION_URL,
            status=status.HTTP_200_OK,
            match=[matchers.json_params_matcher(expected_body, strict_match=False)],
            json=response.model_dump(by_alias=True),
        )

    @staticmethod
    def mock_carbon_emission_error() -> BaseResponse:
        """
        Mock the carbon emission endpoint with an error response.
        """
        return responses.post(
            CARBON_EMISSION_URL,
            status=status.HTTP_200_OK,
            json={"errors": {"service": "unavailable"}},
        )

    @staticmethod
    def mock_carbon_emission_exception(
        status_code: int,
        detail: str,
    ) -> BaseResponse:
        """
        Mock an exception for the carbon emission endpoint.
        """
        return responses.post(
            CARBON_EMISSION_URL,
            status=status_code,
            json={"detail": detail},
        )

    @staticmethod
    def mock_bulk_carbon_emission(
        distances: Optional[Sequence[float]],
        vehicle_type: Optional[VehicleType],
        response: MyclimateBulkCarbonEmission,
    ) -> BaseResponse:
        """
        Mock the bulk carbon emission endpoint.

        If `distances` is null, no parameters will be validated.
        """
        expected_main_body = {"fuel_type": "diesel"}
        if vehicle_type is not None:
            if vehicle_type == VehicleType.BUS:
                expected_main_body |= {"fuel_consumption": BUS_FUEL_CONSUMPTION}
            elif vehicle_type == VehicleType.CAR:
                expected_main_body |= {"car_type": "small"}
            else:
                raise NotImplementedError(f"Type {vehicle_type} not implemented")

        expected_body = {}
        if distances is not None:
            expected_body |= {
                "trips": [
                    expected_main_body | {"km": distance} for distance in distances
                ]
            }

        return responses.post(
            BULK_CARBON_EMISSION_URL,
            status=status.HTTP_200_OK,
            match=[matchers.json_params_matcher(expected_body, strict_match=False)],
            json=response.model_dump(by_alias=True),
        )
