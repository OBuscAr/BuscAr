import random

import pytest
from app.core.database import SessionLocal
from app.exceptions import NotFoundError
from app.services.distance_service import calculate_distance_between_stops

from tests.factories.models import LineFactory, LineStopFactory, StopFactory


@pytest.mark.parametrize("duplicate_stop", [True, False])
def test_distance_between(duplicate_stop: bool):
    """
    GIVEN  two line stops from the same line where the origin has the lowest
           stop order
    WHEN   the `calculate_distance_between_stops` function is called
    THEN   the difference of accumulated distances should be returned
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    first_stop = StopFactory.create_sync()
    first_line_stop = LineStopFactory.create_sync(line=line, stop=first_stop)

    second_stop = StopFactory.create_sync()
    second_line_stop = LineStopFactory.create_sync(
        line=line,
        stop=second_stop,
        stop_order=first_line_stop.stop_order + random.randint(1, 7),
    )

    if duplicate_stop:
        LineStopFactory.create_sync(
            line=line,
            stop=second_stop,
            stop_order=first_line_stop.stop_order - 5,
        )

    # WHEN
    returned_distance = calculate_distance_between_stops(
        db=session,
        line_id=line.id,
        stop_a_id=first_stop.id,
        stop_b_id=second_stop.id,
    )

    # THEN
    assert (
        returned_distance
        == second_line_stop.distance_traveled - first_line_stop.distance_traveled
    )


def test_first_stop_not_found():
    """
    GIVEN  a departure stop_id that does not exist in the line
    WHEN   the `calculate_distance_between_stops` function is called
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    first_stop = StopFactory.create_sync()

    second_stop = StopFactory.create_sync()
    LineStopFactory.create_sync(
        line=line,
        stop=second_stop,
    )

    # WHEN
    # THEN
    with pytest.raises(expected_exception=NotFoundError):
        calculate_distance_between_stops(
            db=session,
            line_id=line.id,
            stop_a_id=first_stop.id,
            stop_b_id=second_stop.id,
        )


def test_second_stop_not_found():
    """
    GIVEN  an arrival stop_id that does not exist in the given line
    WHEN   the `calculate_distance_between_stops` function is called
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    first_stop = StopFactory.create_sync()
    LineStopFactory.create_sync(line=line, stop=first_stop)

    second_stop = StopFactory.create_sync()

    # WHEN
    # THEN
    with pytest.raises(expected_exception=NotFoundError):
        calculate_distance_between_stops(
            db=session,
            line_id=line.id,
            stop_a_id=first_stop.id,
            stop_b_id=second_stop.id,
        )


def test_second_stop_not_found_after_first_stop():
    """
    GIVEN  an arrival stop that exists in the given line but appears
           before the departure stop
    WHEN   the `calculate_distance_between_stops` function is called
    THEN   a `NotFoundError` should be raised
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    first_stop = StopFactory.create_sync()
    LineStopFactory.create_sync(line=line, stop=first_stop, stop_order=2)

    second_stop = StopFactory.create_sync()
    LineStopFactory.create_sync(line=line, stop=second_stop, stop_order=1)

    # WHEN
    # THEN
    with pytest.raises(expected_exception=NotFoundError):
        calculate_distance_between_stops(
            db=session,
            line_id=line.id,
            stop_a_id=first_stop.id,
            stop_b_id=second_stop.id,
        )
