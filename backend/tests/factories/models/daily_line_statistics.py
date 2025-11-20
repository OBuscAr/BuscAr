from app.models import DailyLineStatisticsModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class DailyLineStatisticsFactory(SQLAlchemyFactory[DailyLineStatisticsModel]):
    __check_model__ = False
    __set_relationships__ = True
