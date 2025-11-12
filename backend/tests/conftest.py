from typing import Generator

import pytest
from app.core.database import Base, engine
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def prepare_database():
    """
    Reset database after each test.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client() -> Generator:
    yield TestClient(app)
