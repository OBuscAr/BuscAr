import pytest
from app.commands.create_lines import create_lines
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel
from tests.factories.schemas import SPTransLineFactory
from tests.helpers import SPTransHelper


@pytest.mark.parametrize("num_lines_in_api", [1, 2])
def test_create_line(num_lines_in_api: int):
    """
    GIVEN  no lines in database
    WHEN   the `create_lines` is called
    THEN   new lines should be created
    """
    # GIVEN
    base_name = "8083-10"
    lines = SPTransLineFactory.batch(size=num_lines_in_api, name=base_name)
    SPTransHelper.mock_get_lines(response=lines, pattern=base_name)
    SPTransHelper.mock_get_lines(response=[], pattern=None)

    # WHEN
    create_lines()

    # THEN
    session = SessionLocal()
    assert session.query(LineModel).count() == len(lines)

    for line in lines:
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
    session.add(
        LineModel(
            id=line.id,
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


def test_existing_line_without_api_data():
    """
    GIVEN  an existing line in database without API data
    WHEN   the `create_lines` is called
    THEN   no lines should be updated, there should be no errors
    """
    # GIVEN
    SPTransHelper.mock_get_lines(response=[], pattern=None)

    session = SessionLocal()
    session.add(LineModel(id=1, name="test", direction=LineDirection.MAIN))
    session.commit()

    # WHEN
    create_lines()

    # THEN
    session = SessionLocal()
    assert session.query(LineModel).count() == 1
