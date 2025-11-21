import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.exceptions import MyclimateError, NotFoundError, ValidationError
from app.schemas import (
    EmissionResponse,
    EmissionStatisticsReponse,
    LinesEmissionsResponse,
    VehicleType,
)
from app.services import emission_service

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/emissions",
    tags=["Emissions"],  # Nova tag para a /docs
)


@router.get("", response_model=EmissionResponse)
def calculate_emission_stops(
    line_id: int = Query(..., description="ID da Linha (ex: 2607)"),
    stop_id_a: int = Query(..., description="ID da Parada de Origem"),
    stop_id_b: int = Query(..., description="ID da Parada de Destino"),
    vehicle_type: VehicleType = VehicleType.BUS,
    db: Session = Depends(get_db),
):
    """
    Calculate the carbon emissions between two coordinate stops
    for a BUS vehicle.
    """
    try:
        return emission_service.calculate_emission_stops(
            line_id=line_id,
            stop_id_a=stop_id_a,
            stop_id_b=stop_id_b,
            vehicle_type=vehicle_type,
            db=db,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e),
        )
    except MyclimateError:
        logger.exception("Myclimate error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MyClimate error"
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
    try:
        return emission_service.get_emission_lines_ranking(
            date=date,
            page=page,
            page_size=page_size,
            db=db,
        )
    except MyclimateError:
        logger.exception("Myclimate error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MyClimate error"
        )


@router.get("/lines/statistics")
def get_emission_statistics(
    start_date: date,
    days_range: int = Query(le=100, ge=1),
    db: Session = Depends(get_db),
) -> list[EmissionStatisticsReponse]:
    """
    Return the accumulated emissions of all the SPTrans lines for each date
    in the range from `start_date` to `days_range` after that. The results
    will be ordered by date.
    """
    try:
        return emission_service.get_emission_statistics(
            db=db,
            start_date=start_date,
            days_range=days_range,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )
    except MyclimateError:
        logger.exception("Myclimate error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MyClimate error"
        )


@router.get("/lines/{line_id}/statistics")
def get_line_emission_statistics(
    start_date: date,
    line_id: int,
    days_range: int = Query(le=100, ge=1),
    db: Session = Depends(get_db),
) -> list[EmissionStatisticsReponse]:
    """
    Return the accumulated emissions of the given line for each date
    in the range from `start_date` to `days_range` after that.
    """
    try:
        return emission_service.get_line_emission_statistics(
            db=db,
            start_date=start_date,
            days_range=days_range,
            line_id=line_id,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )
    except MyclimateError:
        logger.exception("Myclimate error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MyClimate error"
        )
