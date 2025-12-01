from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import LoginResponse
from app.services.auth_service import authenticate_user

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/", response_model=LoginResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """
    Login user.
    """
    return authenticate_user(db, form_data.username, form_data.password)
