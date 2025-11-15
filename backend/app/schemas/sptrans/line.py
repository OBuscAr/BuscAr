from pydantic import BaseModel, ConfigDict, Field


class SPTransLine(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    id: int = Field(alias="cl")
    base_name: str = Field(alias="lt")
    operation_mode: int = Field(alias="tl")
    direction: int = Field(alias="sl")
