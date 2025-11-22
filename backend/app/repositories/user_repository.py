from typing import Optional

from sqlalchemy.orm import Session

from app.models import UserModel


def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    """
    Return the user of the given `email`.
    """
    return db.query(UserModel).filter(UserModel.email == email).first()


def create_user(db: Session, user: UserModel) -> UserModel:
    """Adiciona um novo usuário ao banco de dados."""
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
