from pydantic import BaseModel, ConfigDict

from app.schemas.line import Line


class DailyLineStatistics(BaseModel):
    line: Line
    distance_traveled: float

    model_config = ConfigDict(from_attributes=True)
