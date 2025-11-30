from pydantic import BaseModel, ConfigDict, Field


class MyclimateCarbonEmission(BaseModel):
    emission: float = Field(alias="kg")
    id: int = 0  # Returned by the bulk endpoint
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class MyclimateBulkCarbonEmission(BaseModel):
    trips: list[MyclimateCarbonEmission]
