from pydantic import BaseModel
from app.models.line import LineDirection 
from pydantic import ConfigDict

class Line(BaseModel):
    """
    Schema Pydantic to the model LineModel.
    """
    id: int
    name: str  
    direction: LineDirection

    model_config = ConfigDict(from_attributes=True)
