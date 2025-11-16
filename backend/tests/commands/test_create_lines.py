from app.commands.create_lines import create_lines
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel
from tests.factories.schemas import SPTransLineFactory
from tests.helpers import SPTransHelper


def test_create_line():
    """
    GIVEN  no lines in database
    WHEN   the `create_lines` is called
    THEN   new lines should be created
    """
    # GIVEN
    line = SPTransLineFactory.build(id=2606, name="8083-10")
    SPTransHelper.mock_get_lines(response=[line], pattern=line.base_name)
    SPTransHelper.mock_get_lines(response=[], pattern=None)

    # WHEN
    create_lines()

    # THEN
    session = SessionLocal()
    assert session.query(LineModel).count() == 1

    db_line = session.query(LineModel).filter_by(id=line.id).one()
    assert db_line.name == f"{line.base_name}-{line.operation_mode}"
    assert db_line.direction == LineDirection(line.direction)


def test_update_line():
    """
    GIVEN  an existing line in database
    WHEN   the `create_lines` is called
    THEN   the existing line should be updated
    """
    # GIVEN
    line = SPTransLineFactory.build(id=2606, name="8083-10")
    SPTransHelper.mock_get_lines(response=[line], pattern=line.base_name)
    SPTransHelper.mock_get_lines(response=[], pattern=None)

    session = SessionLocal()
    id = line.id
    session.add(
        LineModel(
            id=id,
            name="test",
            direction=(
                LineDirection.MAIN
                if LineDirection.MAIN.value != line.direction
                else LineDirection.SECONDARY
            ),
        )
    )
    session.commit()

    # WHEN
    create_lines()

    # THEN
    session = SessionLocal()
    assert session.query(LineModel).count() == 1

    db_line = session.query(LineModel).filter_by(id=line.id).one()
    assert db_line.name == f"{line.base_name}-{line.operation_mode}"
    assert db_line.direction == LineDirection(line.direction)
