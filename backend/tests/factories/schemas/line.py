from app.schemas import Line
from polyfactory.factories.pydantic_factory import ModelFactory


class LineFactory(ModelFactory[Line]):
    __check_model__ = True
