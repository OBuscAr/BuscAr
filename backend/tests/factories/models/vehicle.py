from app.models import VehicleModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class VehicleFactory(SQLAlchemyFactory[VehicleModel]):
    pass
