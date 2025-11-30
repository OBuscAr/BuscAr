import json
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
from requests import PreparedRequest
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
    def mock_simplified_bulk_carbon_emission(multiplier: float = 2) -> BaseResponse:
        """
        Mock the bulk carbon emission endpoint returning a dynamically
        response equal to distance * `multiplier`.
        """

        def request_callback(request: PreparedRequest) -> tuple[int, dict, str]:
            assert request.body is not None
            payload: dict = json.loads(request.body)
            trips: list[dict] = payload["trips"]
            return (
                status.HTTP_200_OK,
                {},
                MyclimateBulkCarbonEmission(
                    trips=[
                        MyclimateCarbonEmission(
                            id=trip["id"], kg=trip["km"] * multiplier
                        )
                        for trip in trips
                    ]
                ).model_dump_json(by_alias=True),
            )

        return responses.add_callback(
            method=responses.POST,
            url=BULK_CARBON_EMISSION_URL,
            callback=request_callback,
        )

    @staticmethod
    def mock_simplified_bulk_carbon_emission_by_value(
        emission_response: float,
    ) -> BaseResponse:
        """
        Mock the bulk carbon emission endpoint returning a dynamically
        response equal to `emission_response` for each distance.
        """

        def request_callback(request: PreparedRequest) -> tuple[int, dict, str]:
            assert request.body is not None
            payload: dict = json.loads(request.body)
            trips: list[dict] = payload["trips"]
            return (
                status.HTTP_200_OK,
                {},
                MyclimateBulkCarbonEmission(
                    trips=[
                        MyclimateCarbonEmission(id=trip["id"], kg=emission_response)
                        for trip in trips
                    ]
                ).model_dump_json(by_alias=True),
            )

        return responses.add_callback(
            method=responses.POST,
            url=BULK_CARBON_EMISSION_URL,
            callback=request_callback,
        )

    @staticmethod
    def mock_bulk_carbon_emission(
        distances: Sequence[float],
        vehicle_type: Optional[VehicleType],
        response: MyclimateBulkCarbonEmission,
    ) -> BaseResponse:
        """
        Mock the bulk carbon emission endpoint.
        """
        expected_main_body = {"fuel_type": "diesel"}
        if vehicle_type is not None:
            if vehicle_type == VehicleType.BUS:
                expected_main_body |= {"fuel_consumption": BUS_FUEL_CONSUMPTION}
            elif vehicle_type == VehicleType.CAR:
                expected_main_body |= {"car_type": "small"}
            else:
                raise NotImplementedError(f"Type {vehicle_type} not implemented")

        expected_body = {
            "trips": [
                expected_main_body | {"id": i, "km": distance}
                for i, distance in enumerate(distances)
            ]
        }

        return responses.post(
            BULK_CARBON_EMISSION_URL,
            status=status.HTTP_200_OK,
            match=[matchers.json_params_matcher(expected_body, strict_match=False)],
            json=response.model_dump(by_alias=True),
        )

    @staticmethod
    def mock_bulk_carbon_emission_exception(status_code: int) -> BaseResponse:
        """
        Mock an exception for the bulk carbon emission endpoint.
        """
        return responses.post(
            BULK_CARBON_EMISSION_URL,
            status=status_code,
        )
