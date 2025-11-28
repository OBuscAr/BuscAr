from fastapi import APIRouter, Depends
from enum import Enum
from pydantic import BaseModel
from typing import List, Optional
from app.services.route_comparison_service import RouteComparisonService 

from app.schemas.route_comparison import RouteRequest, RouteResponse

router = APIRouter(
    prefix="/api/v1",
    tags=["Route Comparison"],
)

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


