from uuid import uuid4

from app.core.database import Base
from sqlalchemy import Float
from sqlalchemy import UUID, Column, ForeignKey, Integer, UniqueConstraint


class LineStop(Base):
    __tablename__ = "line_stop"
    
    id = Column(UUID, primary_key=True, index=True, default=uuid4)
    line_id = Column(ForeignKey("line.id"), index=True, primary_key=True)
    stop_id = Column(ForeignKey("stop.id"), index=True, primary_key=True)
    stop_order = Column(Integer, index=True, primary_key=True, nullable=False)
    distance_traveled = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("line_id", "stop_id", "stop_order"),)
