from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict

# --------------- Login ----------------------- #
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nome: str
    email: str


# -------------- Cadastro --------------------#

class UserCreateRequest(BaseModel):
    nome: str
    email: EmailStr
    # Adiciona validação de senha no Pydantic
    senha: str = Field(..., min_length=8, max_length=72)

class UserResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
   # criado_em: datetime

    # Config para o Pydantic entender o modelo SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
