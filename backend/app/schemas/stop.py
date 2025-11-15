from pydantic import BaseModel
from pydantic import ConfigDict

class Stop(BaseModel):
    """
    Schema Pydantic to the model StopModel.
    """
    id: int
    name: str
    address: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)
