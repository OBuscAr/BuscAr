from fastapi.testclient import TestClient
from fastapi import status
from app.services import distance_service

def test_calcular_emissao_sucesso(client: TestClient, mocker):
    """
    GIVEN a test client
    WHEN the endpoint /api/v1/emissao is called with valid coordinates
    AND we "mock" (simulate) the distance and myclimate_client
    THEN the endpoint should return 200 OK and the JSON with the calculated data.
    """
    
    mocker.patch(
        "app.services.distance_service.calculate_distance_between_stops",
        return_value=12.5
    )
    
    mocker.patch(
        "app.api.emission_route.myclimate_client.calculate_carbon_emission",
        return_value=50.0
    )

    # Coordenadas de teste 
    url = "/api/v1/emission?line_id=1&stop_id_a=10&stop_id_b=20"

    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["distance_km"] == 12.5
    assert data["emission_kg_co2"] == 50.0


def test_calcular_emissao_distancia_zero(client: TestClient, mocker):
    """
    Tests the edge case where the distance is zero.
    
    GIVEN a test client
    WHEN coordinates A and B are identical
    AND the distance (real) returns 0.0
    THEN the endpoint should return 200 OK with 0 for distance and emission,
    and SHOULD NOT call the MyClimate API.
    """
    
    mocker.patch(
        "app.services.distance_service.calculate_distance_between_stops",
        return_value=0.0
    )
    
    mock_myclimate = mocker.patch(
        "app.api.emission_route.myclimate_client.calculate_carbon_emission"
    )
    
    url = "/api/v1/emission?line_id=1&stop_id_a=10&stop_id_b=10"

    response = client.get(url)

    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["distance_km"] == 0.0
    assert data["emission_kg_co2"] == 0.0
    
    # Verifica se a API MyClimate nunca foi chamada (economia de recursos)
    mock_myclimate.assert_not_called()


def test_calcular_emissao_myclimate_falha(client: TestClient, mocker):
    """
    GIVEN a test client
    WHEN the endpoint is called
    AND the distance works, but MyClimate raises an exception
    THEN the endpoint should catch the exception and return 500.
    """
    
    mocker.patch(
        "app.services.distance_service.calculate_distance_between_stops",
        return_value=12.5
    )
    
    mocker.patch(
        "app.api.emission_route.myclimate_client.calculate_carbon_emission",
        side_effect=Exception("API MyClimate está fora do ar")
    )

    url = "/api/v1/emission?line_id=1&stop_id_a=10&stop_id_b=20"

    response = client.get(url)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "API MyClimate está fora do ar" in response.json()["detail"]


def test_calcular_emissao_input_invalido(client: TestClient):
    """
    Tests whether FastAPI is validating input types.

    GIVEN a test client
    WHEN the endpoint is called with a missing parameter (e.g., without 'lat_b')
    THEN the endpoint should return 422 Unprocessable Entity.
    """
    
    # Chama a URL faltando 'lat_b'
    url = "/api/v1/emission?line_id=1&stop_id_a=10"

    response = client.get(url)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
