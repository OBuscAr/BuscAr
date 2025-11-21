import inspect
from typing import Generator

import pytest
import responses
from app.core.database import Base, engine
from app.main import app
from fastapi.testclient import TestClient

from tests.factories import models
from tests.helpers import SPTransHelper


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """
    Fixture that creates the TestClient.
    """
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
    Base.metadata.create_all(bind=engine)
    responses.start()
    SPTransHelper.mock_login()
    from app.core.database import SessionLocal

    session = SessionLocal()

    for _, factory in inspect.getmembers(models, inspect.isclass):
        factory.__session__ = session

    yield

    # After each test
    Base.metadata.drop_all(bind=engine)
    responses.reset()
