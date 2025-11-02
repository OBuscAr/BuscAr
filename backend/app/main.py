from fastapi import FastAPI
from app.core.database import Base, engine
from app.models import line, line_stop, rota, stop  # noqa: F401
from app.api import login_route  # importa a rota de login
from app.api import user_route # importa a rota de cadastro
from app.models import user

# Inicializa a aplicação
app = FastAPI(title="BuscAr API")

# Cria as tabelas no banco (temporário — depois faremos via Alembic)
Base.metadata.create_all(bind=engine)

# Inclui as rotas
app.include_router(login_route.router)  #  registra o endpoint /login
app.include_router(user_route.router) # registra o endpoint 

# Rota inicial para teste
@app.get("/")
def home():
    return {"status": "Banco conectado e API funcionando "}

