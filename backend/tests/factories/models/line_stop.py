from app.models import LineStopModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class LineStopFactory(SQLAlchemyFactory[LineStopModel]):
    __check_model__ = False
    __set_relationships__ = True
    __set_as_default_factory_for_type__ = True
