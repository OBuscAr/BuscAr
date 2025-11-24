from uuid import UUID, uuid4

from sqlalchemy import UUID as UUID_SQL
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SerializableBase
from app.models.line import Line
from app.models.stop import Stop


class LineStop(SerializableBase):
    __tablename__ = "line_stop"

    id: Mapped[UUID] = mapped_column(
        UUID_SQL,
        primary_key=True,
        index=True,
        default=uuid4,
    )
    line_id: Mapped[int] = mapped_column(ForeignKey("line.id"), index=True)
    line: Mapped[Line] = relationship(Line)

    stop_id: Mapped[int] = mapped_column(ForeignKey("stop.id"), index=True)
    stop: Mapped[Stop] = relationship(Stop)

    stop_order: Mapped[int] = mapped_column(index=True, nullable=False)
    distance_traveled: Mapped[float] = mapped_column(nullable=False)

    __table_args__ = (UniqueConstraint("line_id", "stop_id", "stop_order"),)
