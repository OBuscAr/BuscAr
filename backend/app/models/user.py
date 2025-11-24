from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy_utc import UtcDateTime, utcnow

from app.models.base import SerializableBase


class User(SerializableBase):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(nullable=False)
    criado_em: Mapped[datetime] = mapped_column(UtcDateTime, server_default=utcnow())
