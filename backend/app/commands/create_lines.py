import os

from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel
from app.repositories import sptrans_client
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

FILE_LOCATION = os.path.join(SPTRANS_DATA_PATH, "fare_rules.txt")


def create_lines() -> None:
    """
    Create lines from the static SPTrans data.
    """
    user = sptrans_client.login()
    with open(FILE_LOCATION, "r") as file:
        file_lines = file.readlines()

    session = SessionLocal()
    lines_to_create: list[LineModel] = []
    lines_to_update: list[dict] = []
    existing_ids = session.execute(select(LineModel.id)).scalars().all()
    for file_line in progress_bar(file_lines[1:]):  # Skip the first line
        fare, line_name, _ = file_line.split(",", 2)
        fare = fare.strip('"')
        line_name = line_name.strip('"')
        if fare == "Ônibus":
            lines = sptrans_client.get_lines(credentials=user, pattern=line_name)
            if len(lines) == 0:
                print(f"A linha {line_name} não tem dados na API do SPTrans")
                continue

            for line in lines:
                line_model = LineModel(
                    id=line.id,
                    name=f"{line.base_name}-{line.operation_mode}",
                    direction=LineDirection(line.direction),
                )
                if line.id in existing_ids:
                    lines_to_update.append(line_model.__dict__)
                else:
                    lines_to_create.append(line_model)

    print(f"Criando {len(lines_to_create)} linhas na base de dados...")

    if len(lines_to_create) > 0:
        session.add_all(lines_to_create)
        session.commit()

    print(f"Atualizando {len(lines_to_update)} linhas na base de dados...")
    if len(lines_to_update) > 0:
        session.execute(update(LineModel), lines_to_update)
        session.commit()


if __name__ == "__main__":
    create_lines()
    create_lines()
    create_lines()
    create_lines()
    create_lines()
    create_lines()
    create_lines()
