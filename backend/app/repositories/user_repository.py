from sqlalchemy.orm import Session
from app.models.user import User

def get_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: User) -> User:
    """Adiciona um novo usuário ao banco de dados."""
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
