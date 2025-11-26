import os
from typing import Optional

import pandas as pd
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import LineDirection, LineModel
from app.repositories import sptrans_client

FILE_LOCATION = os.path.join(SPTRANS_DATA_PATH, "fare_rules.txt")


def create_lines(max_rows: Optional[int] = None) -> None:
    """
    Create lines from the static SPTrans data.
    """
    user = sptrans_client.login()
    df = pd.read_csv(
        FILE_LOCATION,
        usecols=["route_id", "fare_id"],
        dtype={"route_id": str, "fare_id": str},
        nrows=max_rows,
    ).fillna("")
    df = df[df["fare_id"] == "Ônibus"]

    session = SessionLocal()
    lines_to_create: list[LineModel] = []
    lines_to_update: list[dict] = []
    existing_ids = session.execute(select(LineModel.id)).scalars().all()
    processed_line_ids: set[int] = set()
    bar = progress_bar(total=df.shape[0])
    for _, row in df.iterrows():
        bar.update(1)
        pattern: str = row["route_id"]

        lines = sptrans_client.get_lines(credentials=user, pattern=pattern)
        if len(lines) == 0:
            print(f"A linha {pattern} não tem dados na API do SPTrans")
            continue

        for line in lines:
            line_name = f"{line.base_name}-{line.operation_mode}"
            if line.id in processed_line_ids:
                continue
            processed_line_ids.add(line.id)

            line_model = LineModel(
                id=line.id,
                name=line_name,
                direction=LineDirection(line.direction.name),
            )
            if line.id in existing_ids:
                lines_to_update.append(line_model.dict())
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
