from datetime import date
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.line import Line


class EmissionResponse(BaseModel):
    """
    Schema para 'enviar' a resposta do nosso endpoint /emissao.
    Ex: {"distance_km": 8.19, "emission_kg_co2": 17.2}
    """

    distance_km: float
    emission_kg_co2: float


class LineEmissionResponse(BaseModel):
    line: Line
    emission: float


class EmissionStatisticsReponse(BaseModel):
    total_emission: Optional[float] = Field(description="emission in kg of CO2")
    date: date
