import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.exceptions import ForbiddenError, MyclimateError, NotFoundError
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


@router.get("")
def get_routes(
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Route]:
    """
    Return the routes of the user, ordered by decreasing created time.
    """
    return route_service.get_routes(
        user_id=user.id,
        db=db,
    )


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(
    route_id: UUID,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """
    Delete the route of the given id.
    """
    try:
        route_service.delete_route(
            user_id=user.id,
            route_id=route_id,
            db=db,
        )
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except ForbiddenError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
