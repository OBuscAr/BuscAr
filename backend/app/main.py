import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api import (
    emission_route,
    line_route,  # importa a rota de linhas
    login_route,  # importa a rota de login
    route_route,
    user_route,  # importa a rota de cadastro
    route_comparison_route,
    air_quality_route,
)

logging.basicConfig(level=logging.INFO)
# Inicializa a aplicação
app = FastAPI(title="BuscAr API")

# origens que podem acessar a API
origins = [
    "http://localhost:5173",  # url do frontend dev build
    "http://localhost:4173",  # url do frontend production build
]

# adiciona o Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # lista de origens permitidas
    allow_credentials=True,  # permite cookies (se necessário no futuro)
    allow_methods=["*"],  # permite todos os métodos (GET, POST, OPTIONS, etc)
    allow_headers=["*"],  # permite todos os cabeçalhos
)


# Rota inicial para teste
@app.get("/", tags=["Health Check"])
def health_check():
    return {"status": "API funcionando"}


# Inclui as rotas
app.include_router(login_route.router)  # registra o endpoint /login
app.include_router(user_route.router)  # registra o endpoint
app.include_router(line_route.router) # registra o endpoint /lines
app.include_router(emission_route.router) # registra o endpoint /emission
app.include_router(route_route.router)
app.include_router(route_comparison_route.router) 
app.include_router(air_quality_route.router)

