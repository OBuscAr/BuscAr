import logging

from app.commands.create_line_stops import (
    create_line_stops,
    load_line_stops,
    load_shapes,
    load_trips,
)
from app.core.database import SessionLocal
from app.models import LineDirection, LineStopModel
from app.schemas import SPTransLineStop, SPTransShape
from pytest import LogCaptureFixture
from pytest_mock import MockFixture

from tests.factories.models import LineFactory, LineStopFactory, StopFactory

LOAD_SHAPES_LOCATION = f"{load_shapes.__module__}.{load_shapes.__name__}"
LOAD_TRIPS_LOCATION = f"{load_trips.__module__}.{load_trips.__name__}"
LOAD_LINE_STOPS_LOCATION = f"{load_line_stops.__module__}.{load_line_stops.__name__}"


def get_code(line_direction: LineDirection) -> str:
    return "0" if line_direction == LineDirection.MAIN else "1"


def test_create_line_stops(mocker: MockFixture):
    """
    GIVEN  an existing line and an existing stop in database
    WHEN   the `create_line_stops` is called
    THEN   the related line stops should be created
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={})
    mocked_shapes = mocker.patch(LOAD_SHAPES_LOCATION, return_value={})

    first_stop_order = 1
    second_stop_order = 18
    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=first_stop_order,
                trip_id=trip_id,
            ),
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=second_stop_order,
                trip_id=trip_id,
            ),
        ],
    )

    # WHEN
    create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    line_stops = session.query(LineStopModel).order_by("stop_order").all()
    assert len(line_stops) == 2
    first, second = line_stops
    assert first.stop_id == second.stop_id == stop.id
    assert first.line_id == second.line_id == line.id
    assert first.stop_order == first_stop_order
    assert second.stop_order == second_stop_order


def test_update_line_stops(mocker: MockFixture):
    """
    GIVEN  an existing line_stop in database
    WHEN   the `create_line_stops` is called
    THEN   the line_stop should be updated
    """
    # GIVEN
    session = SessionLocal()
    target_line_stop = LineStopFactory.create_sync(distance_traveled=5, stop_order=1)
    other_line_stop = LineStopFactory.create_sync(
        line=target_line_stop.line, stop=target_line_stop.stop, stop_order=2
    )
    other_line_stop_distance = other_line_stop.distance_traveled
    trip_id = (
        f"{target_line_stop.line.name}-{get_code(target_line_stop.line.direction)}"
    )
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={})
    mocked_shapes = mocker.patch(LOAD_SHAPES_LOCATION, return_value={})

    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=target_line_stop.stop_id,
                trip_id=trip_id,
                stop_order=target_line_stop.stop_order,
            ),
        ],
    )

    # WHEN
    create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 2
    db_target_line_stop = (
        session.query(LineStopModel).filter_by(id=target_line_stop.id).one()
    )
    db_other_line_stop = (
        session.query(LineStopModel).filter_by(id=other_line_stop.id).one()
    )
    assert db_target_line_stop.distance_traveled == 0
    assert db_other_line_stop.distance_traveled == other_line_stop_distance


def test_distance_line_without_shape(
    mocker: MockFixture,
    caplog: LogCaptureFixture,
):
    """
    GIVEN  an existing line without a shape
    WHEN   the `create_line_stops` is called
    THEN   the line stop should be created with distance 0
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={})
    mocked_shapes = mocker.patch(LOAD_SHAPES_LOCATION, return_value={})

    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=1,
                trip_id=trip_id,
            ),
        ],
    )
    caplog.clear()

    # WHEN
    with caplog.at_level(logging.WARNING):
        create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 1
    line_stop = session.query(LineStopModel).one()
    assert line_stop.distance_traveled == 0

    assert "não tem shape" in caplog.text


def test_distance_shape_without_data(mocker: MockFixture, caplog: LogCaptureFixture):
    """
    GIVEN  an existing line with a shape_id without data
    WHEN   the `create_line_stops` is called
    THEN   the line stop should be created with distance 0
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    shape_id = "test"
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={trip_id: shape_id})
    mocked_shapes = mocker.patch(LOAD_SHAPES_LOCATION, return_value={})

    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=1,
                trip_id=trip_id,
            ),
        ],
    )

    # WHEN
    with caplog.at_level(logging.WARNING):
        create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 1
    line_stop = session.query(LineStopModel).one()
    assert line_stop.distance_traveled == 0

    assert f"shape {shape_id} sem dados" in caplog.text


def test_distance(mocker: MockFixture):
    """
    GIVEN  an existing line with a shape
    WHEN   the `create_line_stops` is called
    THEN   the line stop should be created with the near stop distance
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    shape_id = "test"
    expected_distance = 8
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={trip_id: shape_id})
    mocked_shapes = mocker.patch(
        LOAD_SHAPES_LOCATION,
        return_value={
            shape_id: [
                SPTransShape(
                    sequence=1,
                    distance=(expected_distance - 1),
                    latitude=stop.latitude - 1,
                    longitude=stop.longitude - 1,
                ),
                SPTransShape(
                    sequence=2,
                    distance=expected_distance,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                ),
            ]
        },
    )

    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=2,
                trip_id=trip_id,
            ),
        ],
    )

    # WHEN
    create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 1
    line_stop = session.query(LineStopModel).one()
    assert line_stop.distance_traveled == expected_distance


def test_distance_first_stop(mocker: MockFixture):
    """
    GIVEN  a line stop with stop_order equal to 1
    WHEN   the `create_line_stops` is called
    THEN   the line stop should be created with 0 distance traveled
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    shape_id = "test"
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={trip_id: shape_id})
    mocked_shapes = mocker.patch(
        LOAD_SHAPES_LOCATION,
        return_value={
            shape_id: [
                SPTransShape(
                    sequence=1,
                    distance=1,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                ),
            ]
        },
    )

    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=1,
                trip_id=trip_id,
            ),
        ],
    )

    # WHEN
    create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 1
    line_stop = session.query(LineStopModel).one()
    assert line_stop.distance_traveled == 0


def test_distance_shapes_interval(mocker: MockFixture):
    """
    GIVEN  an existing line with a shape
    WHEN   the `create_line_stops` is called with a `shapes_interval`
    THEN   the distance should be retrieved analyzing the shapes on the given
           interval
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    stop = StopFactory.create_sync()
    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=2,
                trip_id=trip_id,
            )
        ],
    )

    shapes_interval = 5
    expected_distance = 6
    shape_id = "test"
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={trip_id: shape_id})
    mocked_shapes = mocker.patch(
        LOAD_SHAPES_LOCATION,
        return_value={
            shape_id: [
                SPTransShape(
                    sequence=i,
                    distance=expected_distance,
                    latitude=stop.latitude + 1,
                    longitude=stop.longitude + 1,
                )
                for i in range(shapes_interval)
            ]
            + [
                SPTransShape(
                    sequence=shapes_interval,
                    distance=(expected_distance + 1),
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                )
            ]
        },
    )

    # WHEN
    create_line_stops(shapes_interval=shapes_interval)

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == 1
    line_stop = session.query(LineStopModel).one()
    assert line_stop.distance_traveled == expected_distance


def test_distance_duplicate_stops(mocker: MockFixture):
    """
    GIVEN  an existing line with two stops appearing in different parts of the line
    WHEN   the `create_line_stops` is called
    THEN   two line stops should be created with the correct distance according to
           its order in the shape
    """
    # GIVEN
    session = SessionLocal()
    line = LineFactory.create_sync()
    trip_id = f"{line.name}-{get_code(line.direction)}"
    extreme_stop = StopFactory.create_sync()
    mid_stop = StopFactory.create_sync()
    stops = [extreme_stop, mid_stop, extreme_stop]
    distances = [1, 2, 3]
    mocked_line_stops = mocker.patch(
        LOAD_LINE_STOPS_LOCATION,
        return_value=[
            SPTransLineStop(
                stop_id=stop.id,
                stop_order=i + 2,
                trip_id=trip_id,
            )
            for i, stop in enumerate(stops)
        ],
    )

    shape_id = "test"
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={trip_id: shape_id})
    mocked_shapes = mocker.patch(
        LOAD_SHAPES_LOCATION,
        return_value={
            shape_id: [
                SPTransShape(
                    sequence=i,
                    distance=distance,
                    latitude=stop.latitude,
                    longitude=stop.longitude,
                )
                for i, (stop, distance) in enumerate(zip(stops, distances))
            ]
        },
    )

    # WHEN
    create_line_stops()

    # THEN
    mocked_shapes.assert_called()
    mocked_trips.assert_called()
    mocked_line_stops.assert_called()

    assert session.query(LineStopModel).count() == len(stops)
    for i, distance in enumerate(distances):
        line_stop = session.query(LineStopModel).filter_by(stop_order=i + 2).one()
        assert line_stop.distance_traveled == distance
