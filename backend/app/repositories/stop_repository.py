from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import StopModel


def get_stop(db: Session, stop_id: int) -> StopModel:
    """
    Return the stop of the given id.
    """
    try:
        return db.query(StopModel).filter_by(id=stop_id).one()
    except NoResultFound as e:
        raise NotFoundError(f"A parada {stop_id} não existe") from e
