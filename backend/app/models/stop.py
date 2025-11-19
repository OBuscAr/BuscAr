from sqlalchemy import Double
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Stop(Base):
    __tablename__ = "stop"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(index=True, nullable=False)
    address: Mapped[str] = mapped_column(index=False, nullable=False)
    latitude: Mapped[float] = mapped_column(Double, index=False, nullable=False)
    longitude: Mapped[float] = mapped_column(Double, index=False, nullable=False)
