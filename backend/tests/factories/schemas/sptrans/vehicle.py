import random

from app.schemas import (
    SPTransLinesVehiclesResponse,
    SPTransLineVehiclesResponse,
    SPTransVehicle,
)
from polyfactory import Use
from polyfactory.factories.pydantic_factory import ModelFactory


class SPTransVehicleFactory(ModelFactory[SPTransVehicle]):
    __check_model__ = True
    __set_as_default_factory_for_type__ = True

    latitude = Use(lambda: random.uniform(-90, 90))
    longitude = Use(lambda: random.uniform(-90, 90))


class SPTransLineVehiclesResponseFactory(ModelFactory[SPTransLineVehiclesResponse]):
    __check_model__ = True
    __set_as_default_factory_for_type__ = True


class SPTransLinesVehiclesResponseFactory(ModelFactory[SPTransLinesVehiclesResponse]):
    __check_model__ = True
