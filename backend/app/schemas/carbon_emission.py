from pydantic import BaseModel, Field


class CarbonEmission(BaseModel):
    emission: float = Field(alias="kg")
