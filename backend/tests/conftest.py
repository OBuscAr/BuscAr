from typing import Generator

import app.core.database as db_mod
import pytest
import requests
import responses
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.core.dependencies import get_sptrans_cookies  # Dependência da SPTrans real
from app.main import app
from app.models.line import LineDirection
from app.schemas import Line
from fastapi.testclient import TestClient
from requests.cookies import RequestsCookieJar
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from tests.helpers import SPTransHelper

TEST_DB_URL = settings.DATABASE_URL

test_engine = create_engine(
    TEST_DB_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

db_mod.engine = test_engine
db_mod.SessionLocal = TestingSessionLocal

# Garante esquema limpo antes dos testes
from app.core.database import Base as _Base  # evita shadowing

_Base.metadata.drop_all(bind=test_engine)
_Base.metadata.create_all(bind=test_engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    This fixture creates a clean database (SQLite) for each test.
    """
    # Cria todas as tabelas
    Base.metadata.create_all(bind=test_engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        # Destrói todas as tabelas
        Base.metadata.drop_all(bind=test_engine)  # 2. Limpa tudo depois do teste


def override_get_db() -> Generator[Session, None, None]:
    """overrides 'get_db' to use the SQLite test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_sptrans_cookies() -> RequestsCookieJar:
    """
    Overrides 'get_sptrans_cookies' to never call the actual API.
    """
    cookie_jar = RequestsCookieJar()
    cookie_jar.set("fake_session_cookie", "logado-com-sucesso-no-teste")
    return cookie_jar


@pytest.fixture(scope="function")
def client(db: Session, mocker) -> Generator[TestClient, None, None]:
    """
    Fixture that creates the TestClient and overrides dependencies
    and mocks external services.
    """

    # Sobrescreve as dependências do FastAPI
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_sptrans_cookies] = override_get_sptrans_cookies

    # Mock da SPTrans (para os testes de Comando)
    mocker.patch(
        "app.repositories.sptrans_client.login", return_value=RequestsCookieJar()
    )

    mock_line_data = [Line(id=1273, name="8000-10", direction=LineDirection.MAIN)]
    # -------------------------------------------

    mocker.patch(
        "app.repositories.sptrans_client.get_lines", return_value=mock_line_data
    )

    # Fornece o cliente para os testes
    yield TestClient(app)

    # Limpa os overrides depois do teste
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def setup_before_and_after_tests():
    """
    Set up before each test and after each test.
    """
    # Before each test
    responses.start()
    SPTransHelper.mock_login()

    yield

    # After each test
    responses.reset()


def patch_app_db(monkeypatch):

    monkeypatch.setattr(db_mod, "engine", test_engine)
    monkeypatch.setattr(db_mod, "SessionLocal", TestingSessionLocal)
    yield


@pytest.fixture(autouse=True)
def reset_db(request):

    if request.node.get_closest_marker("real_db"):
        Base.metadata.create_all(bind=test_engine)
        yield
        return

    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
