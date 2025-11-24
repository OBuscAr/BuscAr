from datetime import datetime, timezone

from app.models import UserRouteModel
from polyfactory import Use
from polyfactory.factories.sqlalchemy_factory import SQLAlchemyFactory


class UserRouteFactory(SQLAlchemyFactory[UserRouteModel]):
    __check_model__ = False
    __set_relationships__ = True
    __set_as_default_factory_for_type__ = True

    created_at = Use(
        lambda: UserRouteFactory.__faker__.date_time_between(
            start_date=datetime(year=2000, month=1, day=1),
            end_date=datetime(year=2025, month=11, day=1),
            tzinfo=timezone.utc,
        )
    )
