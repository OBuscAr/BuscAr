from app.schemas import SPTransLine
from polyfactory.factories.pydantic_factory import ModelFactory


class SPTransLineFactory(ModelFactory[SPTransLine]):
    __check_model__ = True
    __set_as_default_factory_for_type__ = True
