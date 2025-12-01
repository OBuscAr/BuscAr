# app/core/database.py

from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Cria o engine e a sessão
if "sqlite" in settings.DATABASE_URL:
    # Test database
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()


# Dependência usada nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


try:
    # pylint: disable=unused-import
    import app.models  # só para garantir importação dos módulos de modelo
except Exception:
    pass

# Cria todas as tabelas declaradas
Base.metadata.create_all(bind=engine)
