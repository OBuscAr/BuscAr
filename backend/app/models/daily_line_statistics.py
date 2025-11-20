import datetime

from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SerializableBase
from app.models.line import Line


class DailyLineStatistics(SerializableBase):
    __tablename__ = "daily_line_statistics"

    line_id: Mapped[int] = mapped_column(
        ForeignKey("line.id"),
        index=True,
        primary_key=True,
        nullable=False,
    )
    line: Mapped[Line] = relationship(Line)

    date: Mapped[datetime.date] = mapped_column(
        Date, index=True, primary_key=True, nullable=False
    )
    distance_traveled: Mapped[float] = mapped_column(nullable=False)
