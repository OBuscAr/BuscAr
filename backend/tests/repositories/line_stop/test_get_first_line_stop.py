from app.core.database import SessionLocal
from app.repositories.line_stop_repository import LineStopRepository

from tests.factories.models import LineFactory, LineStopFactory, StopFactory


def test_first_line_stop():
    """
    GIVEN  existing line stops
    WHEN   the `get_first_line_stop` function is called with the correct line and stop
    THEN   the line stop with the lowest stop_order should be returned
    """
    # GIVEN
    session = SessionLocal()
    minimum_stop_order = 5

    line = LineFactory.create_sync()
    stop = StopFactory.create_sync()

    for i in range(7):
        LineStopFactory.create_sync(
            line=line,
            stop=stop,
            stop_order=minimum_stop_order + i + 1,
        )

    expected_line_stop = LineStopFactory.create_sync(
        line=line, stop=stop, stop_order=minimum_stop_order
    )
    # WHEN
    returned_line_stop = LineStopRepository.get_first_line_stop(
        line_id=line.id,
        stop_id=stop.id,
        db=session,
    )

    # THEN
    assert returned_line_stop is not None
    assert returned_line_stop.id == expected_line_stop.id


def test_minimum_stop_order_filter():
    """
    GIVEN  existing line stops with stop order less than `minimum_stop_order`
    WHEN   the `get_first_line_stop` function is called with `minimum_stop_order`
    THEN   a null result should be returned
    """
    # GIVEN
    session = SessionLocal()
    minimum_stop_order = 5

    line = LineFactory.create_sync()
    stop = StopFactory.create_sync()

    LineStopFactory.create_sync(
        line=line,
        stop=stop,
        stop_order=minimum_stop_order - 1,
    )

    # WHEN
    returned_line_stop = LineStopRepository.get_first_line_stop(
        line_id=line.id,
        stop_id=stop.id,
        minimum_stop_order=minimum_stop_order,
        db=session,
    )

    # THEN
    assert returned_line_stop is None


def test_unrelated_line():
    """
    GIVEN  an existing line stop
    WHEN   the `get_first_line_stop` function is called with an unrelated line
    THEN   null should be returned
    """
    # GIVEN
    session = SessionLocal()
    expected_line_stop = LineStopFactory.create_sync()

    # WHEN
    returned_line_stop = LineStopRepository.get_first_line_stop(
        line_id=expected_line_stop.line_id + 1,
        stop_id=expected_line_stop.stop_id,
        db=session,
    )

    # THEN
    assert returned_line_stop is None


def test_unrelated_stop():
    """
    GIVEN  an existing line stop
    WHEN   the `get_first_line_stop` function is called with an unrelated stop
    THEN   null should be returned
    """
    # GIVEN
    session = SessionLocal()
    expected_line_stop = LineStopFactory.create_sync()

    # WHEN
    returned_line_stop = LineStopRepository.get_first_line_stop(
        line_id=expected_line_stop.line_id,
        stop_id=expected_line_stop.stop_id + 1,
        db=session,
    )

    # THEN
    assert returned_line_stop is None
