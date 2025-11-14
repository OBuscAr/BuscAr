from app.core.database import Base, engine
from app.models import line, line_stop, rota, stop, user  # noqa: F401


def create_database_tables() -> None:
    """
    Create database tables.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_database_tables()
