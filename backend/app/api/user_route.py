# app/api/user_route.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user_schema import UserCreateRequest, UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Usuários"])

@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    dados: UserCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint para criar um novo usuário (cadastro).
    """
    user = user_service.create_new_user(db, dados)
    return user
