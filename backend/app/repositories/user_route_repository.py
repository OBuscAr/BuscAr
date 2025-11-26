from uuid import UUID

from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Query, Session

from app.exceptions import NotFoundError
from app.models import UserRouteModel


def create_user_route(db: Session, user_route: UserRouteModel) -> UserRouteModel:
    """
    Create a new user route in the database.
    """
    db.add(user_route)
    db.commit()
    db.refresh(user_route)
    return user_route


def get_user_routes(db: Session, user_id: int) -> Query[UserRouteModel]:
    """
    Return the routes of the given user, ordered by decreasing created time.
    """
    return (
        db.query(UserRouteModel)
        .filter_by(user_id=user_id)
        .order_by(UserRouteModel.created_at.desc())
    )


def get_user_route(db: Session, user_route_id: UUID) -> UserRouteModel:
    """
    Return the user route with the given id.
    """
    try:
        return db.query(UserRouteModel).filter_by(id=user_route_id).one()
    except NoResultFound:
        raise NotFoundError(f"A rota de usuário {user_route_id} não existe")


def delete_user_route(db: Session, user_route: UserRouteModel) -> None:
    """
    Delete the given user route.
    """
    db.delete(user_route)
    db.commit()
