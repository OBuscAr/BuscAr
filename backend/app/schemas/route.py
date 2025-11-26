from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.line import Line
from app.schemas.stop import Stop


class Route(BaseModel):
    id: UUID
    line: Line
    departure_stop: Stop
    arrival_stop: Stop
    distance: float
    emission: float
    emission_saving: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
