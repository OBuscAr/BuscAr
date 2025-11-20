from app.models import LineModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class LineFactory(SQLAlchemyFactory[LineModel]):
    __check_model__ = False
    __set_relationships__ = True
