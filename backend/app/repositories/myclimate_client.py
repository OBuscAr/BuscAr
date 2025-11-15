import requests
from app.core.config import settings
from app.schemas import MyclimateCarbonEmission, VehicleType
from requests.auth import HTTPBasicAuth

BUS_FUEL_CONSUMPTION = 46.2
CARBON_EMISSION_URL = f"{settings.MYCLIMATE_PREFIX_URL}/v1/car_calculators.json"
AUTH = HTTPBasicAuth(settings.MYCLIMATE_USERNAME, settings.MYCLIMATE_PASSWORD)


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
        payload = payload | {"fuel_consumption": BUS_FUEL_CONSUMPTION}
    elif vehicle_type == VehicleType.CAR:
        payload = payload | {"car_type": "small"}
    else:
        raise NotImplementedError(f"O tipo {vehicle_type} não foi implementado")

    response = requests.post(
        CARBON_EMISSION_URL,
        auth=AUTH,
        json=payload,
    )
    response.raise_for_status()
    return MyclimateCarbonEmission(**response.json()).emission
