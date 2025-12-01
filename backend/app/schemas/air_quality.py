from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

class AirQualityIndex(BaseModel):
    code: str
    display_name: str = Field(alias="displayName")
    aqi: int = Field(default=0)
    category: str = Field(default="Unknown")
    
    model_config = ConfigDict(populate_by_name=True)

class AirQualityResponse(BaseModel):
    indexes: List[AirQualityIndex] = Field(default_factory=list)
    health_recommendation: Optional[str] = None 

    @property
    def main_aqi(self) -> Optional[int]:
        """Returns the AQI of the main index (usually the first one)."""
        if self.indexes:
            return self.indexes[0].aqi
        return None
        
    @property
    def main_category(self) -> Optional[str]:
        """Returns the category of the main index."""
        if self.indexes:
            return self.indexes[0].category
        return None

    model_config = ConfigDict(populate_by_name=True)
