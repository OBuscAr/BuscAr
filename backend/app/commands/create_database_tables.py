from app.core.database import Base, engine
from app.models import (  # noqa: F401
    daily_line_emission,
    line,
    line_stop,
    rota,
    stop,
    user,
)


def create_database_tables() -> None:
    """
    Create database tables.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_database_tables()
