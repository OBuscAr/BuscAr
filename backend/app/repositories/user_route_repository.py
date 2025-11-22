from sqlalchemy.orm import Session

from app.models import UserRouteModel


def create_user_route(db: Session, user_route: UserRouteModel) -> UserRouteModel:
    """
    Create a new user route in the database.
    """
    db.add(user_route)
    db.commit()
    db.refresh(user_route)
    return user_route
