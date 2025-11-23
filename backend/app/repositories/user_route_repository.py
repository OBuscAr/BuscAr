from sqlalchemy.orm import Query, Session

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
    Get the routes of the given user, ordered by decreasing created time.
    """
    return (
        db.query(UserRouteModel)
        .filter_by(user_id=user_id)
        .order_by(UserRouteModel.created_at.desc())
    )
