from app.commands.create_stops import create_stops
from app.core.database import SessionLocal
from app.models import StopModel


def test_create_stops():
    """
    GIVEN  no stops
    WHEN   the `create_stops` is called
    THEN   new stops should be created
    """
    # GIVEN
    # WHEN
    create_stops(max_rows=200)

    # THEN
    session = SessionLocal()
    assert session.query(StopModel).count() > 0

    stop = session.query(StopModel).filter_by(id=104763).one()
    assert stop.name == "Av. Luca, 455"
    assert stop.address == "Ref.: R Paulina / R Maria Afonso"
    assert stop.latitude == -23.569481
    assert stop.longitude == -46.559044


def test_update_stops():
    """
    GIVEN  an existing stop
    WHEN   the `create_stops` is called
    THEN   the existing stop should be updated
    """
    # GIVEN
    session = SessionLocal()
    id = 18849
    session.add(StopModel(id=id, name="test", address="test", latitude=0, longitude=0))
    session.commit()

    # WHEN
    create_stops(max_rows=100)

    # THEN
    stop = session.query(StopModel).filter_by(id=id).one()
    assert stop.name == "Vila Madalena"
    assert stop.address == ""
    assert stop.latitude == -23.546498
    assert stop.longitude == -46.691141
