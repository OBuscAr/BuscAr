from app.core.database import SessionLocal
from app.models import LineDirection, LineModel
from app.repositories import sptrans_client
from app.schemas import SPTransLine
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

FILE_LOCATION = "app/commands/sptrans_static_data/fare_rules.txt"


def create_lines() -> None:
    """
    Create lines from the static SPTrans data.
    """
    user = sptrans_client.login()
    with open(FILE_LOCATION, "r") as file:
        file_lines = file.readlines()

    line_data: dict[int, SPTransLine] = {}

    for file_line in progress_bar(file_lines[1:]):  # Skip the first line
        fare, line_name, _ = file_line.split(",", 2)
        fare = fare.strip('"')
        line_name = line_name.strip('"')
        if fare == "Ônibus":
            lines = sptrans_client.get_lines(credentials=user, pattern=line_name)
            if len(lines) == 0:
                print(f"A linha {line_name} não tem dados na API do SPTrans")
            for line in lines:
                line_data[line.id] = line

    session = SessionLocal()
    existing_ids = session.execute(select(LineModel.id)).scalars().all()
    non_existing_ids = set(line_data.keys()) - set(existing_ids)
    print(f"Criando {len(non_existing_ids)} linhas na base de dados...")

    lines_to_create = [
        LineModel(
            id=id,
            name=line_data[id].base_name + "-" + str(line_data[id].operation_mode),
            direction=LineDirection(line_data[id].direction),
        )
        for id in non_existing_ids
    ]

    if len(lines_to_create) > 0:
        session.add_all(lines_to_create)
        session.commit()

    print(f"Atualizando {len(existing_ids)} linhas na base de dados...")
    lines_to_update = [
        LineModel(
            id=id,
            name=line_data[id].base_name + "-" + str(line_data[id].operation_mode),
            direction=LineDirection(line_data[id].direction),
        ).__dict__
        for id in existing_ids
    ]
    if len(lines_to_update) > 0:
        session.execute(update(LineModel), lines_to_update)
        session.commit()


if __name__ == "__main__":
    create_lines()
