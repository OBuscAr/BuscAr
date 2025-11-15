from typing import Generator

import pytest
import responses
from app.core.database import Base, engine
from app.main import app
from fastapi.testclient import TestClient
from tests.helpers import SPTransHelper


@pytest.fixture(autouse=True)
def setup_before_and_after_tests():
    """
    Set up before each test and after each test.
    """
    # Before each test
    responses.start()
    Base.metadata.create_all(bind=engine)
    SPTransHelper.mock_login()

    yield

    # After each test
    Base.metadata.drop_all(engine)
    responses.reset()


@pytest.fixture()
def client() -> Generator:
    yield TestClient(app)
