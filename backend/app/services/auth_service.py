from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import check_password, create_token
from app.models import UserModel
from app.repositories.user_repository import get_user_by_email
from app.schemas import LoginResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> UserModel:
    """
    Retrive the current user from the auth token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = get_user_by_email(db=db, email=email)
    if user is None:
        raise credentials_exception
    return user


def authenticate_user(db: Session, email: str, senha: str) -> LoginResponse:
    """
    Authenticate user.
    """
    user = get_user_by_email(db, email)
    if not user or not check_password(senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )
    token = create_token({"sub": user.email})
    return LoginResponse(access_token=token, nome=user.nome, email=user.email)
