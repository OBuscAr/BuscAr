# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Carrega variáveis do arquivo .env
load_dotenv()

# URL de conexão com o banco de dados (ajuste conforme seu banco)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/buscar_db")

# Cria o engine e a sessão
engine = create_engine(DATABASE_URL)
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

