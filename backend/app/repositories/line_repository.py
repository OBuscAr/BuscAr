from sqlalchemy import select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import LineDirection, LineModel


class LineRepository:
    @staticmethod
    def get_line(db: Session, line_id: int) -> LineModel:
        """
        Return the line of the given id.
        """
        try:
            return db.query(LineModel).filter_by(id=line_id).one()
        except NoResultFound as e:
            raise NotFoundError(f"A linha {line_id} não existe") from e

    @staticmethod
    def search(db: Session, term: str | None):
        query = select(LineModel)
        if term:
            query = query.where(LineModel.name.contains(term))
        return db.execute(query).scalars().all()

    @staticmethod
    def find_by_term_and_direction(db: Session, term: str, sentido: int | None):
        query = select(LineModel).where(LineModel.name.contains(term))

        if sentido:
            try:
                direction = LineDirection(sentido)
                query = query.where(LineModel.direction == direction)
            except ValueError:
                return None

        return db.execute(query).scalars().first()
