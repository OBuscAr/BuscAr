import random

from app.models import DailyLineStatisticsModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class DailyLineStatisticsFactory(SQLAlchemyFactory[DailyLineStatisticsModel]):
    __check_model__ = False
    __set_relationships__ = True

    distance_traveled = Use(lambda: random.uniform(1, 100))
