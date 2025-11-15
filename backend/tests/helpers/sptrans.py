from typing import Optional, Sequence

import responses
from app.repositories.sptrans_client import LINES_LOOK_UP_URL, LOGIN_URL
from app.schemas import Line
from fastapi import status
from responses import BaseResponse, matchers


class SPTransHelper:
    """
    Helper to mock external calls to SPTrans API.
    """

    CREDENTIALS_COOKIES = {"Credentials": "test"}

    @staticmethod
    def mock_login() -> None:
        """
        Mock the login endpoint of SPTrans.
        """
        responses.post(
            LOGIN_URL,
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def mock_get_lines(
        lines_response: Sequence[Line], pattern: Optional[str] = None
    ) -> BaseResponse:
        """
        Mock the get lines endpoint of SPTrans.
        """
        match = []
        if pattern is not None:
            match.append(matchers.query_param_matcher({"termosBusca": pattern}))
        return responses.get(
            LINES_LOOK_UP_URL,
            status=status.HTTP_200_OK,
            match=match,
            json=[line.model_dump(by_alias=True) for line in lines_response],
        )
