from pydantic import BaseModel


class EmissionResponse(BaseModel):
    """
    Schema para 'enviar' a resposta do nosso endpoint /emissao.
    Ex: {"distance_km": 8.19, "emission_kg_co2": 17.2}
    """

    distance_km: float
    emission_kg_co2: float
