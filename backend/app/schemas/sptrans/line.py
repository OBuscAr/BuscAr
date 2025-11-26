from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SPTransLineDirection(Enum):
    MAIN = 1
    SECONDARY = 2


class SPTransLine(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    id: int = Field(alias="cl")
    base_name: str = Field(alias="lt")
    operation_mode: int = Field(alias="tl")
    direction: SPTransLineDirection = Field(alias="sl")
