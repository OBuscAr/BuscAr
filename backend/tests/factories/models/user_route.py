from app.models import UserRouteModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class UserRouteFactory(SQLAlchemyFactory[UserRouteModel]):
    __check_model__ = False
    __set_relationships__ = True
