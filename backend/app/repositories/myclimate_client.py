import logging

import requests
from requests.auth import HTTPBasicAuth
from tenacity import (
    before_sleep_log,
    retry,
    stop_after_attempt,
    wait_random_exponential,
)

from app.core.config import settings
from app.exceptions import MyclimateError
from app.schemas import MyclimateCarbonEmission, VehicleType

BUS_FUEL_CONSUMPTION = 46.2
CARBON_EMISSION_URL = f"{settings.MYCLIMATE_PREFIX_URL}/v1/car_calculators.json"
AUTH = HTTPBasicAuth(settings.MYCLIMATE_USERNAME, settings.MYCLIMATE_PASSWORD)

logger = logging.getLogger(__name__)


@retry(
    reraise=True,
    before_sleep=before_sleep_log(logger, logging.INFO),
    stop=stop_after_attempt(max_attempt_number=3),
    wait=wait_random_exponential(multiplier=1, min=2, max=6),
)
def calculate_carbon_emission(distance: float, vehicle_type: VehicleType) -> float:
    """
    Calculate the carbon emission (in kg) for a given distance.

    Parameters:
    - `distance`: Distance in km.
    - `vehicle_type`: Bus or car type.
    """
    if distance < 1:
        # Myclimate does not supporte distances less than 1
        return 0
    payload = {
        "fuel_type": "diesel",
        "km": distance,
    }
    if vehicle_type == VehicleType.BUS:
        payload = payload | {"fuel_consumption": BUS_FUEL_CONSUMPTION}
    elif vehicle_type == VehicleType.CAR:
        payload = payload | {"car_type": "small"}
    else:
        raise NotImplementedError(f"O tipo {vehicle_type} não foi implementado")

    try:
        response = requests.post(
            CARBON_EMISSION_URL,
            auth=AUTH,
            json=payload,
        )
        response.raise_for_status()
    except Exception as e:
        raise MyclimateError from e

    json_response = response.json()
    if "errors" in json_response:
        raise MyclimateError(json_response["errors"])

    return MyclimateCarbonEmission(**response.json()).emission
