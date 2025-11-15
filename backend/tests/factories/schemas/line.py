from app.schemas import SPTransLine
from polyfactory.factories.pydantic_factory import ModelFactory


class SPTransLineFactory(ModelFactory[SPTransLine]):
    __check_model__ = True
