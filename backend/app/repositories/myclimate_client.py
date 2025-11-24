import logging
from typing import Sequence

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
from app.schemas import (
    MyclimateBulkCarbonEmission,
    MyclimateCarbonEmission,
    VehicleType,
)

BUS_FUEL_CONSUMPTION = 46.2
AUTH = HTTPBasicAuth(settings.MYCLIMATE_USERNAME, settings.MYCLIMATE_PASSWORD)

CARBON_EMISSION_URL = f"{settings.MYCLIMATE_PREFIX_URL}/v1/car_calculators.json"

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
        payload |= {"fuel_consumption": BUS_FUEL_CONSUMPTION}
    elif vehicle_type == VehicleType.CAR:
        payload |= {"car_type": "small"}
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


BULK_CARBON_EMISSION_URL = (
    f"{settings.MYCLIMATE_PREFIX_URL}/v1/bulk_car_calculators.json"
)


def bulk_calculate_carbon_emission(
    distances: Sequence[float], vehicle_type: VehicleType
) -> list[float]:
    """
    Calculate the carbon emission (in kg) for a given list of distances.

    Parameters:
    - `distances`: Distances list in km.
    - `vehicle_type`: Bus or car type.
    """
    base_single_payload = {
        "fuel_type": "diesel",
    }
    if vehicle_type == VehicleType.BUS:
        base_single_payload |= {"fuel_consumption": BUS_FUEL_CONSUMPTION}
    elif vehicle_type == VehicleType.CAR:
        base_single_payload |= {"car_type": "small"}
    else:
        raise NotImplementedError(f"O tipo {vehicle_type} não foi implementado")

    payload = {
        "trips": [base_single_payload | {"km": distance} for distance in distances]
    }
    response = requests.post(
        BULK_CARBON_EMISSION_URL,
        auth=AUTH,
        json=payload,
    )
    response.raise_for_status()

    trips = MyclimateBulkCarbonEmission(**response.json()).trips
    return [trip.emission for trip in trips]
