from enum import Enum

from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import SerializableBase


class LineDirection(str, Enum):
    MAIN = "MAIN"
    SECONDARY = "SECONDARY"


class Line(SerializableBase):
    __tablename__ = "line"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(index=True, nullable=False)
    direction: Mapped[LineDirection] = mapped_column(nullable=False)
