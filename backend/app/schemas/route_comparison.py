from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.air_quality import AirQualityResponse

class SegmentType(str, Enum):
    BUS = "BUS"
    WALK = "WALK"
    OTHER = "OTHER"

class PolylineData(BaseModel):
    encodedPolyline: str
    
class RouteRequest(BaseModel):
    origin_address: str
    destination_address: str

class RouteSegment(BaseModel):
    type: SegmentType
    instruction: str            
    distance_km: float
    duration_text: Optional[str] = None 
    
    line_name: Optional[str] = None    
    line_color: Optional[str] = None    
    vehicle_type: Optional[str] = None  
    
    polyline: PolylineData
    
class RouteInfo(BaseModel):
    description: str            
    distance_km: float
    emission_kg_co2: float
    
    polyline: PolylineData 
    
    segments: List[RouteSegment] 

        
class RouteResponse(BaseModel):
    origin_air_quality: Optional[AirQualityResponse] = None
    destination_air_quality: Optional[AirQualityResponse] = None
    routes: List[RouteInfo]
    
