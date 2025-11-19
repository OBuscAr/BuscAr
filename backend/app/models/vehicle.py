from sqlalchemy import Column, DateTime, Double, ForeignKey, Integer

from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicle"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    line_id = Column(
        ForeignKey("line.id"),
        index=True,
        nullable=False,
    )
    latitude = Column(Double, index=False, nullable=False)
    longitude = Column(Double, index=False, nullable=False)
    update_at = Column(DateTime, nullable=False)
