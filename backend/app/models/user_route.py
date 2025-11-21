from datetime import datetime
from uuid import uuid4

from sqlalchemy import UUID, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SerializableBase
from app.models.line import Line
from app.models.stop import Stop
from app.models.user import User


class UserRoute(SerializableBase):
    __tablename__ = "user_route"

    id: Mapped[UUID] = mapped_column(UUID, primary_key=True, index=True, default=uuid4)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )
    user: Mapped[User] = relationship(User)

    line_id: Mapped[int] = mapped_column(
        ForeignKey("line.id"),
        nullable=False,
    )
    line: Mapped[Line] = relationship(Line)

    departure_stop_id: Mapped[int] = mapped_column(
        ForeignKey("stop.id"),
        nullable=False,
    )
    departure_stop: Mapped[Stop] = relationship(Stop, foreign_keys=[departure_stop_id])

    arrival_stop_id: Mapped[int] = mapped_column(
        ForeignKey("stop.id"),
        nullable=False,
    )
    arrival_stop: Mapped[Stop] = relationship(Stop, foreign_keys=[arrival_stop_id])

    distance: Mapped[float] = mapped_column(nullable=False)
    emission: Mapped[float] = mapped_column(nullable=False)
    emission_saving: Mapped[float] = mapped_column(nullable=False)
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
