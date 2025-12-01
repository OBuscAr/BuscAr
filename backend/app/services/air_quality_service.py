import logging
from typing import Optional

from app.repositories import air_quality_client
from app.schemas.air_quality import AirQualityResponse, AirQualityIndex
from app.repositories import google_maps_client

logger = logging.getLogger(__name__)

def get_air_quality_by_coords(lat: float, lon: float) -> Optional[AirQualityResponse]:
    """
    Service that orchestrates the retrieval and formatting of air quality data
    """
    try:
        data = air_quality_client.fetch_air_quality(lat, lon)
        if not data:
            return None

        indexes_data = data.get("indexes", [])
        parsed_indexes = []
        for idx in indexes_data:
            parsed_indexes.append(
                AirQualityIndex(
                    code=idx.get("code"),
                    displayName=idx.get("displayName"),
                    aqi=idx.get("aqi"),
                    category=idx.get("category")
                )
            )

        health_recs = data.get("healthRecommendations", {})
        recommendation_text = health_recs.get("generalPopulation") or \
                              health_recs.get("elderly") or \
                              health_recs.get("lungDiseasePopulation")

        return AirQualityResponse(
            indexes=parsed_indexes,
            health_recommendation=recommendation_text
        )

    except Exception as e:
        logger.error(f"Erro no serviço de qualidade do ar: {e}")
        return None

def get_air_quality_from_address(address: str):
    coords = google_maps_client.get_coordinates_from_address(address)

    if not coords:
        return None 

    lat = coords["latitude"]
    lon = coords["longitude"]

    air_quality = get_air_quality_by_coords(lat, lon)

    return {
        "latitude": lat,
        "longitude": lon,
        "air_quality": air_quality
    }
