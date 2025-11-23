from pydantic import BaseModel


class SPTransShape(BaseModel):
    latitude: float
    longitude: float
    sequence: int
    distance: float
