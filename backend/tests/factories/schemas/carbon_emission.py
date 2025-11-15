from app.schemas import CarbonEmission
from polyfactory.factories.pydantic_factory import ModelFactory


class CarbonEmissionFactory(ModelFactory[CarbonEmission]):
    __check_model__ = True
