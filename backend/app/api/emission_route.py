from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from requests.exceptions import HTTPError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import myclimate_client
from app.schemas import (
    EmissionResponse,
    EmissionStatisticsReponse,
    LinesEmissionsResponse,
    VehicleType,
)
from app.services import distance_service, emission_service

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
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
) -> LinesEmissionsResponse:
    """
    Return the ranking of the lines ordered by decreasing carbon emission.

    Parameters:
    - `date`: To filter results by this date.
    - `page_size` and `page`: results will be divided in blocks of `page_size`
       and the function will return the `page`-th block.
    """
    return emission_service.get_emission_lines_ranking(
        date=date,
        page=page,
        page_size=page_size,
        db=db,
    )


@router.get("/statistics")
def get_emission_statistics(
    start_date: date,
    days_range: int = Query(le=100, ge=1),
    line_id: Optional[int] = None,
    db: Session = Depends(get_db),
) -> list[EmissionStatisticsReponse]:
    """
    Return the accumulate emissions of all the SPTrans lines for each date
    in the range from `start_date` to `days_range` after that.
    If there is no data for some date, null fields will be returned for that entry.

    Optinally, a `line_id` can be given to filter the emission statistics.
    """
    # TODO: Implement
    return [
        EmissionStatisticsReponse(
            total_emission=None, date=start_date + timedelta(days=d)
        )
        for d in range(days_range)
    ]
