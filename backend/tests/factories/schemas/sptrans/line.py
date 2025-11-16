import random

from app.models import LineDirection
from app.schemas import SPTransLine
from polyfactory import Use
from polyfactory.factories.pydantic_factory import ModelFactory


class SPTransLineFactory(ModelFactory[SPTransLine]):
    __check_model__ = True

    direction = Use(lambda: random.choice(list(LineDirection)))
