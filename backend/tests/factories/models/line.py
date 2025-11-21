from app.models import LineModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class LineFactory(SQLAlchemyFactory[LineModel]):
    __check_model__ = False
    __set_relationships__ = True

    id = Use(lambda: LineFactory.__random__.randint(1, int(1e8)))
