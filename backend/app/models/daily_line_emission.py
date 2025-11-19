import datetime

from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DailyLineEmission(Base):
    __tablename__ = "daily_line_emission"

    line_id: Mapped[int] = mapped_column(
        ForeignKey("line.id"),
        index=True,
        primary_key=True,
        nullable=False,
    )
    date: Mapped[datetime.date] = mapped_column(
        Date, index=True, primary_key=True, nullable=False
    )
    emission: Mapped[float] = mapped_column(nullable=False)
