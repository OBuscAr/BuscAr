from app.core.database import Base
from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy import Float

class LineStop(Base):
    __tablename__ = "line_stop"

    line_id = Column(ForeignKey("line.id"), index=True, primary_key=True)
    stop_id = Column(ForeignKey("stop.id"), index=True, primary_key=True)
    stop_order = Column(Integer, index=True, primary_key=True, nullable=False)
    distance_traveled = Column(Float, nullable=False)
