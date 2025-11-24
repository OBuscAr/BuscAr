from pydantic import BaseModel


class Point(BaseModel):
    latitude: float
    longitude: float

    def to_tuple(self) -> tuple[float, float]:
        """
        Transform point to tuple.
        """
        return (self.latitude, self.longitude)
