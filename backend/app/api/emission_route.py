from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from requests.exceptions import HTTPError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import myclimate_client
from app.schemas import (
    EmissionResponse,
    EmissionStatisticsReponse,
    LineEmissionResponse,
    VehicleType,
)
from app.services import distance_service

router = APIRouter(
    prefix="/emissions",
    tags=["Emissions"],  # Nova tag para a /docs
)


@router.get("", response_model=EmissionResponse)
def calculate_emission_stops(
    line_id: int = Query(..., description="ID da Linha (ex: 2607)"),
    stop_id_a: int = Query(..., description="ID da Parada de Origem"),
    stop_id_b: int = Query(..., description="ID da Parada de Destino"),
    db: Session = Depends(get_db),
):
    """
    Calculate the carbon emissions
    of a BUS between two coordinate points.
    """
    distance_ab_km: float = 0.0
    emission_calculate_kg: float = 0.0

    try:
        distance_ab_km = distance_service.calculate_distance_between_stops(
            db=db,
            line_id=line_id,
            stop_a_id=stop_id_a,
            stop_b_id=stop_id_b,
        )

        if distance_ab_km == 0:
            return EmissionResponse(distance_km=0, emission_kg_co2=0)

        # Chama o serviço MyClimate
        emission_calculate_kg = myclimate_client.calculate_carbon_emission(
            distance=distance_ab_km,
            vehicle_type=VehicleType.BUS,
        )

        return EmissionResponse(
            distance_km=distance_ab_km,
            emission_kg_co2=emission_calculate_kg,
        )

    except NotImplementedError:
        raise HTTPException(status_code=501, detail="Tipo de veículo não implementado.")
    except HTTPError as e:
        raise HTTPException(
            status_code=500, detail=f"Erro interno no cálculo: {e}: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro interno no cálculo: {str(e)}"
        )


@router.get("/lines")
def get_emission_lines_ranking(
    date: date,
    db: Session = Depends(get_db),
) -> list[LineEmissionResponse]:
    """
    Return the ranking of the lines ordered by decreasing carbon emission filtered
    by a given `date`.
    """
    return []


@router.get("/statistics")
def get_emission_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
) -> EmissionStatisticsReponse:
    """
    Return the accumulate emission of all the SPTrans bus system from
    `start_date` to `end_date`. If there is no date in the range date,
    null fields will be returned.
    """
    return EmissionStatisticsReponse(total_emission=None)
