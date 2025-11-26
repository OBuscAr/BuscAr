from datetime import date

from pydantic import BaseModel, Field

from app.schemas.line import Line
from app.schemas.pagination import PaginationResponse


class EmissionResponse(BaseModel):
    """
    Schema para 'enviar' a resposta do nosso endpoint /emissao.
    Ex: {"distance_km": 8.19, "emission_kg_co2": 17.2}
    """

    distance_km: float
    emission_kg_co2: float


class LineEmissionResponse(BaseModel):
    line: Line
    emission: float = Field(description="emission in kg of CO2")
    distance: float = Field(description="distance in km")


class LinesEmissionsResponse(BaseModel):
    lines_emissions: list[LineEmissionResponse]
    pagination: PaginationResponse


class EmissionStatisticsReponse(BaseModel):
    total_emission: float = Field(description="emission in kg of CO2")
    total_distance: float = Field(description="distance in km")
    date: date
