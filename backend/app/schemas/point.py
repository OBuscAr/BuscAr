from pydantic import BaseModel


class Point(BaseModel):
    latitude: float
    longitude: float
