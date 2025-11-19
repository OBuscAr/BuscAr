from enum import Enum

from sqlalchemy import Column, Integer, String
from sqlalchemy import Enum as EnumDB

from app.core.database import Base


class LineDirection(str, Enum):
    MAIN = "MAIN"
    SECONDARY = "SECONDARY"


class Line(Base):
    __tablename__ = "line"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    direction = Column(EnumDB(LineDirection), nullable=False)
