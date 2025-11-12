from fastapi import status
from fastapi.testclient import TestClient

ENDPOINT_URL = "/"


def test_health_check(client: TestClient):
    """
    GIVEN
    WHEN   the health check endpoint is called
    THEN   a 200 response should be returned
    """
    # WHEN
    response = client.get(ENDPOINT_URL)

    # THEN
    assert response.status_code == status.HTTP_200_OK
