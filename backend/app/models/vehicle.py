from datetime import datetime

from sqlalchemy import DateTime, Double, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import SerializableBase


class Vehicle(SerializableBase):
    __tablename__ = "vehicle"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True, nullable=False
    )
    line_id: Mapped[int] = mapped_column(
        ForeignKey("line.id"),
        index=True,
        nullable=False,
    )
    latitude: Mapped[float] = mapped_column(Double, index=False, nullable=False)
    longitude: Mapped[float] = mapped_column(Double, index=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
