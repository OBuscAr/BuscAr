from pydantic import BaseModel, Field


class MyclimateCarbonEmission(BaseModel):
    emission: float = Field(alias="kg")
