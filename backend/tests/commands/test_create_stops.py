from app.commands.create_stops import create_stops
from app.core.database import SessionLocal
from app.models import StopModel
from sqlalchemy import func, select


def test_create_stops():
    """
    GIVEN  no stops
    WHEN   the `create_stops` is called
    THEN   new stops should be created
    """
    # GIVEN
    # WHEN
    create_stops()

    # THEN
    session = SessionLocal()
    assert session.execute(select(func.count("*")).select_from(StopModel)).scalar() > 0

    stop = session.query(StopModel).filter_by(id=370010262).one()
    assert stop.name == "R. Charruas, 5"
    assert stop.address == "Ref.: R Pampa/ R Getulio Vargas Filho"
    assert stop.latitude == -23.644969
    assert stop.longitude == -46.635801


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
    create_stops()

    # THEN
    stop = session.query(StopModel).filter_by(id=id).one()
    assert stop.name == "Vila Madalena"
    assert stop.address == ""
    assert stop.latitude == -23.546498
    assert stop.longitude == -46.691141
