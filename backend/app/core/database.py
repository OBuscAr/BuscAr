# app/core/database.py

from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cria o engine e a sessão
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

