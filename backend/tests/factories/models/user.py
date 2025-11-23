from app.models import UserModel
from polyfactory import Ignore
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class UserFactory(SQLAlchemyFactory[UserModel]):
    __check_model__ = False
    __set_relationships__ = True
    __set_as_default_factory_for_type__ = True

    criado_em = Ignore()
