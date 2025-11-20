import random

from app.models import VehicleModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class VehicleFactory(SQLAlchemyFactory[VehicleModel]):
    latitude = Use(lambda: random.uniform(-90, 90))
    longitude = Use(lambda: random.uniform(-90, 90))
