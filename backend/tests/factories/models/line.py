from app.models import LineModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class LineFactory(SQLAlchemyFactory[LineModel]):
    pass
