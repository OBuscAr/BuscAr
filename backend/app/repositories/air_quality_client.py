import logging
import requests
from tenacity import (
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_random_exponential,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

AIR_QUALITY_API_URL = "https://airquality.googleapis.com/v1/currentConditions:lookup"

@retry(
    reraise=True,
    before_sleep=before_sleep_log(logger, logging.INFO),
    stop=stop_after_attempt(max_attempt_number=3),
    wait=wait_random_exponential(multiplier=1, min=2, max=6),
)
def fetch_air_quality(lat: float, lon: float) -> dict:
    """
    Performs the HTTP request to the Google Air Quality API.
    Includes automatic retries in case of failure.
    """
    if not settings.GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY não configurada. Retornando dados vazios.")
        return {}

    headers = {
        "Content-Type": "application/json"
    }
    
    url = f"{AIR_QUALITY_API_URL}?key={settings.GOOGLE_API_KEY}"

    body = {
        "location": {
            "latitude": lat,
            "longitude": lon
        },
        "extraComputations": [
            "HEALTH_RECOMMENDATIONS",
            "DOMINANT_POLLUTANT_CONCENTRATION",
            "POLLUTANT_CONCENTRATION",
            "LOCAL_AQI"
        ],
        "languageCode": "pt-BR"
    }

    try:
        response = requests.post(url, json=body, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Erro ao buscar qualidade do ar: {e}")
        raise e
