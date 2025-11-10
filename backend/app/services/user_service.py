# app/services/user_service.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories import user_repository
from app.core.security import generate_hash_password
from app.models.user import User
from app.schemas.user_schema import UserCreateRequest

def create_new_user(db: Session, dados: UserCreateRequest) -> User:
    """
    Serviço para criar um novo usuário.
    1. Verifica se o e-mail já existe.
    2. Gera o hash da senha.
    3. Cria o usuário no banco.
    """
    # Verifica se o e-mail já está em uso
    existing_user = user_repository.get_by_email(db, email=dados.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado."
        )

    # Gera o hash da senha
    password_hash = generate_hash_password(dados.senha)

    # Cria o novo objeto User (modelo SQLAlchemy)
    new_user = User(
        nome=dados.nome,
        email=dados.email,
        senha_hash=password_hash
    )

    # Salva no banco através do repositório
    user_created = user_repository.create_user(db, new_user)
    return user_created
