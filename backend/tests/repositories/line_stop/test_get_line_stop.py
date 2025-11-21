import pytest
from app.core.database import SessionLocal
from app.exceptions import NotFoundError
from app.repositories.line_stop_repository import LineStopRepository

from tests.factories.models import LineStopFactory


def test_existing_line_stop():
    """
    GIVEN  an existing line stop
    WHEN   the `get_line_stop` function is called with the correct line and stop
    THEN   the related line stop should be returned
    """
    # GIVEN
    session = SessionLocal()
    expected_line_stop = LineStopFactory.create_sync()

    # WHEN
    returned_line_stop = LineStopRepository.get_line_stop(
        line_id=expected_line_stop.line_id,
        stop_id=expected_line_stop.stop_id,
        db=session,
    )

    # THEN
    assert returned_line_stop.id == expected_line_stop.id


def test_unrelated_line():
    """
    GIVEN  an existing line stop
    WHEN   the `get_line_stop` function is called with an unrelated line
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    expected_line_stop = LineStopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(NotFoundError):
        LineStopRepository.get_line_stop(
            line_id=expected_line_stop.line_id + 1,
            stop_id=expected_line_stop.stop_id,
            db=session,
        )


def test_unrelated_stop():
    """
    GIVEN  an existing line stop
    WHEN   the `get_line_stop` function is called with an unrelated stop
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    expected_line_stop = LineStopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(NotFoundError):
        LineStopRepository.get_line_stop(
            line_id=expected_line_stop.line_id,
            stop_id=expected_line_stop.stop_id + 1,
            db=session,
        )
