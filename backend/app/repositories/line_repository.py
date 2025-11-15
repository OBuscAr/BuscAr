from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.line import Line, LineDirection


class LineRepository:

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

