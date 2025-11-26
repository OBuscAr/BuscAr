from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SPTransVehicle(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    id: int = Field(alias="p")
    latitude: float = Field(alias="py")
    longitude: float = Field(alias="px")
    updated_at: datetime = Field(alias="ta")


class SPTransLineVehiclesResponse(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    line_id: int = Field(alias="cl")
    line_name: str = Field(alias="c")
    vehicles: list[SPTransVehicle] = Field(alias="vs", default=[])


class SPTransLinesVehiclesResponse(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    lines_vehicles: list[SPTransLineVehiclesResponse] = Field(alias="l", default=[])
