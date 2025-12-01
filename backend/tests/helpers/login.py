from app.main import app
from app.models import UserModel
from app.services.auth_service import get_current_user


class LoginHelper:
    @staticmethod
    def mock_current_user(user: UserModel = UserModel(id=1, email="test")):
        """
        Mock the user returned when accessing an endpoint.
        """
        app.dependency_overrides[get_current_user] = lambda: user
