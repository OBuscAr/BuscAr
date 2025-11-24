from app.commands.create_line_stops import (
    create_line_stops,
    load_line_stops,
    load_shapes,
    load_trips,
)
from app.core.database import SessionLocal
from app.models import LineDirection, LineStopModel
from app.schemas import SPTransLineStop
from pytest_mock import MockFixture

from tests.factories.models import LineFactory, StopFactory

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
    mocked_shapes = mocker.patch(LOAD_SHAPES_LOCATION, return_value={})
    mocked_trips = mocker.patch(LOAD_TRIPS_LOCATION, return_value={})

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
