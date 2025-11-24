from app.schemas import EmissionResponse, VehicleType
from fastapi import status
from fastapi.testclient import TestClient
from pytest_mock import MockerFixture

from tests.factories.models import LineFactory, LineStopFactory, StopFactory
from tests.factories.schemas import MyclimateCarbonEmissionFactory
from tests.helpers import MyclimateHelper

ENDPOINT_URL = "/emissions"


def test_calcular_emissao_sucesso(client: TestClient, mocker: MockerFixture):
    """
    GIVEN  existing line, stops and line_stops, and a test client
    WHEN   the `/emissions` endpoint is called with valid coordinates
           and we "mock" (simulate) the distance and myclimate_client
    THEN   the endpoint should return 200 OK and the JSON with the calculated data.
    """
    # GIVEN
    MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=VehicleType.BUS,
        response=MyclimateCarbonEmissionFactory.build(),
    )
    line = LineFactory.create_sync()
    stop_a = StopFactory.create_sync()
    stop_b = StopFactory.create_sync()
    LineStopFactory.create_sync(line=line, stop=stop_a)
    LineStopFactory.create_sync(line=line, stop=stop_b)
    params = {
        "line_id": line.id,
        "stop_id_a": stop_a.id,
        "stop_id_b": stop_b.id,
    }

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK, response.json()
    EmissionResponse(**response.json())


def test_line_stop_not_found(client: TestClient):
    """
    GIVEN  a line without the given stop
    WHEN   the `/emissions` endpoint is called
    THEN   a response with status `HTTP_404_NOT_FOUND` should be returned
    """
    # GIVEN
    params = {"line_id": 1, "stop_id_a": 10, "stop_id_b": 20}  # Coordenadas de teste

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_calcular_emissao_distancia_zero(client: TestClient, mocker: MockerFixture):
    """
    Tests the edge case where the distance is zero.

    GIVEN  a test client
    WHEN   the `/emissions` endpoint is called with identical coordinates
    THEN   the endpoint should return 200 OK with 0 for distance and emission,
           and SHOULD NOT call the MyClimate API.
    """

    mocker.patch(
        "app.services.distance_service.calculate_distance_between_stops",
        return_value=0.0,
    )
    mock_myclimate = MyclimateHelper.mock_carbon_emission(
        distance=None,
        vehicle_type=None,
        response=MyclimateCarbonEmissionFactory.build(),
    )
    params = {"line_id": 1, "stop_id_a": 10, "stop_id_b": 10}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_200_OK
    data = EmissionResponse(**response.json())
    assert data.distance_km == 0
    assert data.emission_kg_co2 == 0

    # Verifica se a API MyClimate nunca foi chamada (economia de recursos)
    assert mock_myclimate.call_count == 0


def test_calcular_emissao_myclimate_falha(client: TestClient, mocker: MockerFixture):
    """
    GIVEN  a test client
    WHEN   the `/emissions` endpoint is called and the distance works,
           but MyClimate raises an exception
    THEN   the endpoint should catch the exception and return
           a response with status HTTP_503_SERVICE_UNAVAILABLE.
    """
    # GIVEN
    mocker.patch(
        "app.services.distance_service.calculate_distance_between_stops",
        return_value=12.5,
    )

    exception_detail = "MyClimate error"
    MyclimateHelper.mock_carbon_emission_error()
    params = {"line_id": 1, "stop_id_a": 10, "stop_id_b": 20}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert exception_detail in response.json()["detail"]


def test_calcular_emissao_input_invalido(client: TestClient):
    """
    Tests whether FastAPI is validating input types.

    GIVEN  a test client
    WHEN   the `/emissions` endpoint is called with a missing parameter
           (e.g., without 'lat_b')
    THEN   the endpoint should return a response
           with status HTTP_422_UNPROCESSABLE_CONTENT.
    """
    # GIVEN
    # Chama a URL faltando 'lat_b'
    params = {"line_id": 1, "stop_id_a": 10}

    # WHEN
    response = client.get(ENDPOINT_URL, params=params)

    # THEN
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
