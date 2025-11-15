from pydantic import BaseModel, Field


class SPTransStop(BaseModel):
    id: int = Field(alias="cp")
    name: str = Field(alias="np")
    address: str = Field(alias="ed")
    latitude: float = Field(alias="py")
    longitude: float = Field(alias="px")
