from typing import Sequence

import requests
from requests.auth import HTTPBasicAuth

from app.core.config import settings
from app.schemas import (
    MyclimateBulkCarbonEmission,
    MyclimateCarbonEmission,
    VehicleType,
)

BUS_FUEL_CONSUMPTION = 46.2
AUTH = HTTPBasicAuth(settings.MYCLIMATE_USERNAME, settings.MYCLIMATE_PASSWORD)

CARBON_EMISSION_URL = f"{settings.MYCLIMATE_PREFIX_URL}/v1/car_calculators.json"


def calculate_carbon_emission(distance: float, vehicle_type: VehicleType) -> float:
    """
    Calculate the carbon emission (in kg) for a given distance.

    Parameters:
    - `distance`: Distance in km.
    - `vehicle_type`: Bus or car type.
    """
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

    response = requests.post(
        CARBON_EMISSION_URL,
        auth=AUTH,
        json=payload,
    )
    response.raise_for_status()
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
