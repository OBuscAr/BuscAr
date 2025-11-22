from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Return the user of the given `email`.
    """
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: User) -> User:
    """Adiciona um novo usuário ao banco de dados."""
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
