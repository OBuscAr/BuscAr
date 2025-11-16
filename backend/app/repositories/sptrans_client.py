import requests
from app.core.config import settings
from app.schemas import SPTransLine
from pydantic import TypeAdapter
from requests.cookies import RequestsCookieJar

LOGIN_URL = f"{settings.PREFIX_URL}/Login/Autenticar"


def login() -> RequestsCookieJar:
    """
    Login to Olho Vivo API and return the cookies to use in other endpoint calls.
    """
    response = requests.post(LOGIN_URL, params={"token": settings.API_TOKEN})
    response.raise_for_status()
    return response.cookies


LINES_URL = f"{settings.PREFIX_URL}/Linha"
LINES_LOOK_UP_URL = f"{LINES_URL}/Buscar"


def get_lines(credentials: RequestsCookieJar, pattern: str) -> list[SPTransLine]:
    """
    Get all the lines that contains the given `pattern`.

    Parameters:
    - `pattern`: The pattern to look up.
    """
    response = requests.get(
        LINES_LOOK_UP_URL,
        params={"termosBusca": pattern},
        cookies=credentials,
    )
    response.raise_for_status()
    return TypeAdapter(list[SPTransLine]).validate_python(response.json())
