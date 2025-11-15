from app.schemas import MyclimateCarbonEmission
from polyfactory.factories.pydantic_factory import ModelFactory


class MyclimateCarbonEmissionFactory(ModelFactory[MyclimateCarbonEmission]):
    __check_model__ = True
