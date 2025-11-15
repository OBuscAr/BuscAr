from app.repositories.sptrans_client import login
from tests.helpers import SPTransHelper


def test_response():
    """
    GIVEN  default credentials to be returned
    WHEN   the `login` is called
    THEN   the expected credentials should be returned
    """
    # GIVEN
    # WHEN
    returned_credentials = login()

    # THEN
    assert returned_credentials == SPTransHelper.CREDENTIALS_COOKIES
