from fastapi import APIRouter, Depends, Query, Path, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.line import Line as LineSchema
from app.schemas.stop import Stop as StopSchema

from app.services.line_service import LineService

router = APIRouter(
    prefix="/api/v1",
    tags=["Lines and Stops"]
)

@router.get("/lines", response_model=List[LineSchema])
def search_lines(
    term: str | None = Query(None, description="Termo de busca (ex: 8000-10)"),
    db: Session = Depends(get_db)
):
    return LineService.search_lines(db, term)


@router.get("/lines/{line_id}/stops", response_model=List[StopSchema])
def search_stops_by_line(
    line_id: int = Path(..., description="ID da linha"),
    db: Session = Depends(get_db)
):
    stops = LineService.get_stops_for_line(db, line_id)
    if not stops:
        raise HTTPException(status_code=404, detail="Nenhuma parada encontrada para esta linha.")
    return stops


@router.get("/stops-line", response_model=List[StopSchema])
def search_stops_by_term(
    term: str = Query(..., min_length=1),
    sentido: int | None = Query(None, description="1 = MAIN, 2 = SECONDARY", enum=[1, 2]),
    db: Session = Depends(get_db)
):
    stops = LineService.search_stops_by_line_term(db, term, sentido)
    if not stops:
        raise HTTPException(status_code=404, detail="Linha encontrada, mas sem paradas.")
    return stops


@router.get("/lines/{line_id}/nearest_stop", response_model=StopSchema)
def nearest_stop(
    line_id: int = Path(...),
    lat: float = Query(...),
    lon: float = Query(...),
    db: Session = Depends(get_db)
):
    stop = LineService.get_nearest_stop(db, line_id, lat, lon)
    if not stop:
        raise HTTPException(status_code=404, detail="Nenhuma parada válida encontrada.")
    return stop

