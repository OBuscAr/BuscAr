import requests
from app.core.config import settings # Você precisa adicionar sua GOOGLE_API_KEY ao config
from requests.exceptions import HTTPError

GOOGLE_ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
# Você precisa adicionar sua GOOGLE_API_KEY ao config
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
        "routes.legs.steps.staticDuration"
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
        print("--- ERRO NA API DO GOOGLE ---")
        print(f"Status Code: {e.response.status_code}")
        print(f"Detalhe do Erro: {e.response.json()}")
        print("-----------------------------")
        raise e
    return response.json()
