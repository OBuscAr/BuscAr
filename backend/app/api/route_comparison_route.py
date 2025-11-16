from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.services.route_comparison_service import RouteComparisonService 

router = APIRouter(
    prefix="/api/v1",
    tags=["Route Comparison"],
)

class RouteRequest(BaseModel):
    origin_address: str
    destination_address: str

class PolylineData(BaseModel):
    encodedPolyline: str

class RouteInfo(BaseModel):
    description: str
    distance_km: float
    emission_kg_co2: float
    polyline: PolylineData  

class RouteResponse(BaseModel):
    routes: List[RouteInfo]

@router.post("/compare-bus-routes", response_model=RouteResponse)
def compare_routes(
    request: RouteRequest,
    service: RouteComparisonService = Depends(RouteComparisonService)
):
    """
    Calculates and compares CO2 emissions for bus routes
    between an origin and a destination.
    """
    routes = service.calculate_bus_route_emissions(
        request.origin_address, 
        request.destination_address
    )
    return {"routes": routes}


