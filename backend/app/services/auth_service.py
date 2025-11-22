from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import check_password, create_token
from app.repositories.user_repository import get_by_email
from app.schemas import LoginResponse


def authenticate_user(db: Session, email: str, senha: str) -> LoginResponse:
    """
    Authenticate user.
    """
    user = get_by_email(db, email)
    if not user or not check_password(senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )
    token = create_token({"sub": user.email})
    return LoginResponse(access_token=token, nome=user.nome, email=user.email)
