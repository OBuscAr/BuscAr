from pydantic import BaseModel, ConfigDict, Field


class MyclimateCarbonEmission(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)
    emission: float = Field(alias="kg")
