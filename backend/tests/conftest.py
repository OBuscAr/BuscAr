from typing import Generator

import pytest
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture()
def client() -> Generator:
    yield TestClient(app)
