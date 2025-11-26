from app.core.database import Base, engine
from app.models import (  # noqa: F401
    daily_line_statistics,
    line,
    line_stop,
    stop,
    user,
    user_route,
    vehicle,
)


def create_database_tables() -> None:
    """
    Create database tables.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_database_tables()
