from uuid import uuid4

from sqlalchemy import UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LineStop(Base):
    __tablename__ = "line_stop"

    id: Mapped[UUID] = mapped_column(UUID, primary_key=True, index=True, default=uuid4)
    line_id: Mapped[int] = mapped_column(ForeignKey("line.id"), index=True)
    stop_id: Mapped[int] = mapped_column(ForeignKey("stop.id"), index=True)
    stop_order: Mapped[int] = mapped_column(index=True, nullable=False)
    distance_traveled: Mapped[float] = mapped_column(nullable=False)

    __table_args__ = (UniqueConstraint("line_id", "stop_id", "stop_order"),)
