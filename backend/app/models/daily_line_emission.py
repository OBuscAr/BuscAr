from app.core.database import Base
from sqlalchemy import Column, Date, Float, ForeignKey, String


class DailyLineEmission(Base):
    __tablename__ = "daily_line_emission"

    name = Column(String, index=True, nullable=False)
    line_id = Column(
        ForeignKey("line.id"),
        index=True,
        primary_key=True,
        nullable=False,
    )
    date = Column(Date, index=True, primary_key=True, nullable=False)
    emission = Column(Float, nullable=False)
