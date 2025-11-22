import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.exceptions import MyclimateError, NotFoundError
from app.models import UserModel
from app.schemas import Route
from app.services import route_service
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/routes",
    tags=["Routes"],  # Nova tag para a /docs
)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_route(
    line_id: int,
    departure_stop_id: int,
    arrival_stop_id: int,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Route:
    """
    Save the route of the user with the given fields.
    """
    try:
        return route_service.create_route(
            user_id=user.id,
            line_id=line_id,
            departure_stop_id=departure_stop_id,
            arrival_stop_id=arrival_stop_id,
            db=db,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except MyclimateError:
        logger.exception("Myclimate error")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MyClimate error"
        )
