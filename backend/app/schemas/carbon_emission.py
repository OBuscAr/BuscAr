from datetime import date
from typing import Annotated

from pydantic import BaseModel, Field

from app.schemas.line import Line
from app.schemas.pagination import PaginationResponse
from app.schemas.validators import DefaultRoundedFloat, round_to


class EmissionResponse(BaseModel):
    """
    Schema para 'enviar' a resposta do nosso endpoint /emissao.
    Ex: {"distance_km": 8.19, "emission_kg_co2": 17.2}
    """

    distance_km: Annotated[float, round_to(3)]
    emission_kg_co2: Annotated[float, round_to(3)]


class LineEmissionResponse(BaseModel):
    line: Line
    emission: DefaultRoundedFloat = Field(description="emission in kg of CO2")
    distance: DefaultRoundedFloat = Field(description="distance in km")


class LinesEmissionsResponse(BaseModel):
    lines_emissions: list[LineEmissionResponse]
    pagination: PaginationResponse


class EmissionStatisticsReponse(BaseModel):
    total_emission: DefaultRoundedFloat = Field(description="emission in kg of CO2")
    total_distance: DefaultRoundedFloat = Field(description="distance in km")
    date: date
