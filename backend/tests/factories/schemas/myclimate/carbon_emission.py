from app.schemas import MyclimateBulkCarbonEmission, MyclimateCarbonEmission
from polyfactory.factories.pydantic_factory import ModelFactory


class MyclimateCarbonEmissionFactory(ModelFactory[MyclimateCarbonEmission]):
    __check_model__ = True


class MyclimateBulkCarbonEmissionFactory(ModelFactory[MyclimateBulkCarbonEmission]):
    __check_model__ = True
