from uuid import uuid4

from app.core.database import Base
from sqlalchemy import UUID, Column, ForeignKey, Integer, UniqueConstraint


class LineStop(Base):
    __tablename__ = "line_stop"

    id = Column(UUID, primary_key=True, index=True, default=uuid4)
    line_id = Column(ForeignKey("line.id"), index=True)
    stop_id = Column(ForeignKey("stop.id"), index=True)
    stop_order = Column(Integer, index=True, nullable=False)

    __table_args__ = (UniqueConstraint("line_id", "stop_id", "stop_order"),)
