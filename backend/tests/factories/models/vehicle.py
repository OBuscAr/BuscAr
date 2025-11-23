import random

from app.models import VehicleModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class VehicleFactory(SQLAlchemyFactory[VehicleModel]):
    __check_model__ = False
    __set_relationships__ = True
    __set_as_default_factory_for_type__ = True

    latitude = Use(lambda: random.uniform(-90, 90))
    longitude = Use(lambda: random.uniform(-90, 90))
