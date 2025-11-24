from app.models import StopModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class StopFactory(SQLAlchemyFactory[StopModel]):
    __check_model__ = False
    __set_relationships__ = True
    __set_as_default_factory_for_type__ = True

    latitude = Use(lambda: StopFactory.__random__.uniform(-90, 90))
    longitude = Use(lambda: StopFactory.__random__.uniform(-90, 90))
