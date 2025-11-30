from app.schemas import MyclimateBulkCarbonEmission, MyclimateCarbonEmission
from polyfactory import Use
from polyfactory.factories.pydantic_factory import ModelFactory


class MyclimateCarbonEmissionFactory(ModelFactory[MyclimateCarbonEmission]):
    __check_model__ = True
    __set_as_default_factory_for_type__ = True

    emission = Use(lambda: MyclimateCarbonEmissionFactory.__random__.uniform(0, 1000))


class MyclimateBulkCarbonEmissionFactory(ModelFactory[MyclimateBulkCarbonEmission]):
    __set_as_default_factory_for_type__ = True
    __check_model__ = True
