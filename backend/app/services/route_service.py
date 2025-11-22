from sqlalchemy.orm import Session

from app.models import UserRouteModel
from app.repositories import user_route_repository
from app.schemas import Route, VehicleType
from app.services import emission_service


def create_route(
    user_id: int,
    line_id: int,
    departure_stop_id: int,
    arrival_stop_id: int,
    db: Session,
) -> Route:
    """
    Create a route for the given user and return the created object.
    """
    bus_emission = emission_service.calculate_emission_stops(
        line_id=line_id,
        stop_id_a=departure_stop_id,
        stop_id_b=arrival_stop_id,
        vehicle_type=VehicleType.BUS,
        db=db,
    )
    car_emission = emission_service.calculate_emission_stops(
        line_id=line_id,
        stop_id_a=departure_stop_id,
        stop_id_b=arrival_stop_id,
        vehicle_type=VehicleType.CAR,
        db=db,
    )
    user_route = UserRouteModel(
        user_id=user_id,
        line_id=line_id,
        departure_stop_id=departure_stop_id,
        arrival_stop_id=arrival_stop_id,
        distance=bus_emission.distance_km,
        emission=bus_emission.emission_kg_co2,
        emission_saving=car_emission.emission_kg_co2 - bus_emission.emission_kg_co2,
    )

    created_user_route = user_route_repository.create_user_route(
        db=db, user_route=user_route
    )

    return Route.model_validate(created_user_route)
