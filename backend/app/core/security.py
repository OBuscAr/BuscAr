from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def check_password(senha, senha_hash):
    return pwd_context.verify(senha, senha_hash)


def generate_hash_password(senha: str) -> str:
    """Gera o hash de uma senha em texto plano."""
    return pwd_context.hash(senha)


def create_token(dados: dict):
    to_encode = dados.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# Teste do bcrypt

"""
def test_bcrypt():
    test_password = "minha1234"
    print(f"Testando senha: '{test_password}'")
    print(f"Tamanho: {len(test_password)} chars, {len(test_password.encode('utf-8'))} bytes")
    try:
        result = pwd_context.hash(test_password)
        print("SUCESSO - Hash gerado:", result[:20] + "...")
        return True
    except Exception as e:
        print("ERRO:", e)
        return False

# Execute esse teste uma vez
if __name__ == "__main__":
    test_bcrypt() 
"""
