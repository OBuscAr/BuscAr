import logging

import requests
from app.core.config import settings
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)

GOOGLE_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
GOOGLE_API_KEY = settings.GOOGLE_API_KEY 

def find_bus_routes(origin_address: str, destination_address: str) -> dict:
    """
    Chama a API computeRoutes do Google para encontrar rotas de ônibus.
    """
    
    
    field_mask = (
        "routes.legs.steps.travelMode,"
        "routes.legs.steps.distanceMeters,"
        "routes.legs.steps.transitDetails.transitLine," 
        "routes.polyline.encodedPolyline,"
        "routes.legs.steps.navigationInstruction,"
        "routes.legs.steps.transitDetails.headsign,"
        "routes.legs.steps.transitDetails.transitLine.nameShort,"
        "routes.legs.steps.transitDetails.transitLine.vehicle,"
        "routes.legs.steps.transitDetails.transitLine.color,"
        "routes.legs.steps.polyline.encodedPolyline,"
        "routes.description,"
        "routes.legs.steps.staticDuration,"
        "routes.legs.startLocation.latLng.latitude,"
        "routes.legs.startLocation.latLng.longitude,"
        "routes.legs.endLocation.latLng.latitude,"
        "routes.legs.endLocation.latLng.longitude"
    )
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": field_mask
    }

    body = {
        "origin": {"address": origin_address},
        "destination": {"address": destination_address},
        "travelMode": "TRANSIT",
        "computeAlternativeRoutes": True, # possíveis rotas
        "transitPreferences": {
            # ESSENCIAL para filtrar "só com ônibus"
            "allowedTravelModes": ["BUS"] 
        },
        "languageCode": "pt-BR",
        "units": "METRIC"
    }

    response = requests.post(GOOGLE_ROUTES_API_URL, json=body, headers=headers)
    
    try:
        response.raise_for_status() 
    except HTTPError as e:
        logger.error("--- ERRO NA API DO GOOGLE ---")
        logger.error(f"Status Code: {e.response.status_code}")
        try:
            error_detail = e.response.json()
            logger.error(f"Detalhe do Erro: {error_detail}")
        except Exception:
            logger.error(f"Resposta: {e.response.text}")
        logger.error("-----------------------------")
        raise e
    return response.json()

def get_coordinates_from_address(address: str):
    field_mask = (
        "routes.legs.startLocation.latLng.latitude,"
        "routes.legs.startLocation.latLng.longitude"
    )

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": field_mask
    }

    body = {
        "origin": {"address": address},
        "destination": {"address": address},  # <-- truque
        "travelMode": "DRIVE"
    }

    response = requests.post(GOOGLE_ROUTES_API_URL, json=body, headers=headers)
    response.raise_for_status()

    data = response.json()

    try:
        loc = data["routes"][0]["legs"][0]["startLocation"]["latLng"]
        return {
            "latitude": loc["latitude"],
            "longitude": loc["longitude"]
        }
    except (KeyError, IndexError, TypeError) as e:
        logger.warning(f"Erro ao extrair coordenadas da resposta: {e}")
        return None

