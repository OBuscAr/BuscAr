from app.models import UserModel
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class UserFactory(SQLAlchemyFactory[UserModel]):
    __check_model__ = False
    __set_relationships__ = True
