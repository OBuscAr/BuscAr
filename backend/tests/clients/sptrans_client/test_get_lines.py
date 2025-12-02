from app.clients.sptrans_client import get_lines

from tests.factories.schemas import SPTransLineFactory
from tests.helpers import SPTransHelper


def test_response():
    """
    GIVEN  a list of lines to be returned by the SPTrans API
    WHEN   the `get_lines` is called
    THEN   the related lines should be returned
    """
    # GIVEN
    expected_lines = SPTransLineFactory.batch(size=2)
    pattern = "test"
    endpoint_mock = SPTransHelper.mock_get_lines(
        response=expected_lines, pattern=pattern
    )

    # WHEN
    returned_lines = get_lines(
        credentials=SPTransHelper.COOKIE_JAR,
        pattern=pattern,
    )

    # THEN
    assert returned_lines == expected_lines
    assert endpoint_mock.call_count == 1
