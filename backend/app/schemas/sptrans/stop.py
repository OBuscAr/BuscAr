from pydantic import BaseModel, ConfigDict, Field


class SPTransStop(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    id: int = Field(alias="cp")
    name: str = Field(alias="np")
    address: str = Field(alias="ed")
    latitude: float = Field(alias="py")
    longitude: float = Field(alias="px")
