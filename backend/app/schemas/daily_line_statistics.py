from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.line import Line


class DailyLineStatistics(BaseModel):
    line: Line
    date: date
    distance_traveled: float

    model_config = ConfigDict(from_attributes=True)
