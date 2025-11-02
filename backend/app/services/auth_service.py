from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.user_repository import get_by_email
from app.core.security import check_password, create_token

def authenticate_user(db: Session, email: str, senha: str):
    user = get_by_email(db, email)
    if not user or not check_password(senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos."
        )
    token = create_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "nome": user.nome,
        "email": user.email
    }

