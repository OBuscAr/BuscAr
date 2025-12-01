from pydantic import ConfigDict

from app.schemas.point import Point


class Stop(Point):
    """
    Schema Pydantic to the model StopModel.
    """

    id: int
    name: str
    address: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)
