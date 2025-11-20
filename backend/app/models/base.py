from typing import Any

from app.core.database import Base


class SerializableBase(Base):
    __abstract__ = True

    def dict(self) -> dict[str, Any]:
        """
        Convert model to dict.
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
