from app.commands.create_line_stops import create_line_stops, load_shapes, load_trips
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel, LineStopModel, StopModel
from pytest_mock import MockFixture

LOAD_SHAPES_LOCATION = f"{load_shapes.__module__}.{load_shapes.__name__}"
LOAD_TRIPS_LOCATION = f"{load_trips.__module__}.{load_trips.__name__}"


def test_create_line_stops(mocker: MockFixture):
    """
    GIVEN  an existing line and an existing stop in database
    WHEN   the `create_line_stops` is called
    THEN   the related line stops should be created
    """
    # GIVEN
    session = SessionLocal()
    line = LineModel(id=2570, name="1012-21", direction=LineDirection.MAIN)
    stop = StopModel(
        id=301789,
        name="Terminal Jardim Britânia",
        address="",
        latitude=0,
        longitude=0,
    )
    mocker.patch(LOAD_SHAPES_LOCATION, return_value={})
    mocker.patch(LOAD_TRIPS_LOCATION, return_value={})

    session.add(line)
    session.add(stop)
    session.commit()

    # WHEN
    create_line_stops(max_rows=100)

    # THEN
    line_stops = session.query(LineStopModel).order_by("stop_order").all()
    assert len(line_stops) == 2
    first, second = line_stops
    assert first.stop_id == second.stop_id == stop.id
    assert first.line_id == second.line_id == line.id
    assert first.stop_order == 1
    assert second.stop_order == 18
