from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user_schema import LoginRequest, LoginResponse
from app.services.auth_service import authenticate_user

router = APIRouter(prefix="/login", tags=["Login"])

@router.post("/", response_model=LoginResponse)
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    return authenticate_user(db, dados.email, dados.senha)

