from app.commands.create_line_stops import create_line_stops
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel, LineStopModel, StopModel


def test_create_line_stops():
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
