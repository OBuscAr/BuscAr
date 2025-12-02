from typing import Optional, Sequence

import responses
from app.clients.sptrans_client import LINES_LOOK_UP_URL, LOGIN_URL, POSITION_URL
from app.schemas import SPTransLine, SPTransLinesVehiclesResponse
from fastapi import status
from requests.cookies import cookiejar_from_dict
from responses import BaseResponse


class SPTransHelper:
    """
    Helper to mock external calls to SPTrans API.
    """

    CREDENTIALS_COOKIES = {"credentials": "test"}
    COOKIE_JAR = cookiejar_from_dict(CREDENTIALS_COOKIES)

    @staticmethod
    def mock_login() -> None:
        """
        Mock the login endpoint.
        """
        responses.post(
            LOGIN_URL,
            status=status.HTTP_200_OK,
            headers={
                "set-cookie": ";".join(
                    f"{key}={value}"
                    for key, value in SPTransHelper.CREDENTIALS_COOKIES.items()
                )
            },
        )

    @staticmethod
    def mock_get_lines(
        response: Sequence[SPTransLine], pattern: Optional[str] = None
    ) -> BaseResponse:
        """
        Mock the get lines endpoint.
        """
        url = LINES_LOOK_UP_URL
        if pattern is not None:
            url = f"{url}?termosBusca={pattern}"

        return responses.get(
            LINES_LOOK_UP_URL,
            status=status.HTTP_200_OK,
            json=[line.model_dump(by_alias=True, mode="json") for line in response],
        )

    @staticmethod
    def mock_get_vehicles_positions(
        response: SPTransLinesVehiclesResponse,
    ) -> BaseResponse:
        """
        Mock the get vehicles positions endpoint.
        """
        return responses.get(
            POSITION_URL,
            status=status.HTTP_200_OK,
            json=response.model_dump(by_alias=True, mode="json"),
        )
