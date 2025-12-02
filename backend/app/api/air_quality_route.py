from fastapi import APIRouter
from pydantic import BaseModel
from app.services.air_quality_service import get_air_quality_from_address

router = APIRouter(
    prefix="/api/v1",
    tags=["Air Quality"]
)

class AirQualityRequest(BaseModel):
    address: str

@router.post("/air-quality-address")
def air_quality_by_address(request: AirQualityRequest):
    result = get_air_quality_from_address(request.address)
    if not result:
        return {"error": "Unable to retrieve air quality for this address"}

    return result

