from sqlalchemy import Column, Date, Float, ForeignKey

from app.core.database import Base


class DailyLineStatistics(Base):
    __tablename__ = "daily_line_statistics"

    line_id = Column(
        ForeignKey("line.id"),
        index=True,
        primary_key=True,
        nullable=False,
    )
    date = Column(Date, index=True, primary_key=True, nullable=False)
    distance_traveled = Column(Float, nullable=False)
