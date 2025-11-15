from app.api import login_route  # importa a rota de login
from app.api import user_route  # importa a rota de cadastro
from app.core.database import Base, engine
from app.models import line, line_stop, rota, stop, user  # noqa: F401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import line_route #importa a rota de linhas
from app.api import emission_route
from app.core.config import settings

# Inicializa a aplicação
app = FastAPI(title="BuscAr API")

# origens que podem acessar a API
origins = [
    "http://localhost:5173",  # url do frontend react
]

# adiciona o Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # lista de origens permitidas
    allow_credentials=True,  # permite cookies (se necessário no futuro)
    allow_methods=["*"],  # permite todos os métodos (GET, POST, OPTIONS, etc)
    allow_headers=["*"],  # permite todos os cabeçalhos
)

# Cria as tabelas no banco 
if not settings.DATABASE_URL.startswith("sqlite:///:memory:"):
    Base.metadata.create_all(bind=engine)

# Rota inicial para teste
@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "API funcionando"}


# Inclui as rotas
app.include_router(login_route.router)  # registra o endpoint /login
app.include_router(user_route.router)  # registra o endpoint
app.include_router(line_route.router) # registra o endpoint /lines
app.include_router(emission_route.router) # registra o endpoint /emission
