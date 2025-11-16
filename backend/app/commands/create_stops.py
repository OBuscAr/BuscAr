import os
from typing import Optional

import pandas as pd
from app.commands.sptrans_static_data import SPTRANS_DATA_PATH
from app.core.database import SessionLocal
from app.models import StopModel
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

FILE_LOCATION = os.path.join(SPTRANS_DATA_PATH, "stops.txt")


def create_stops(max_rows: Optional[int] = None) -> None:
    """
    Create stops from the static SPTrans data.
    """
    df = pd.read_csv(
        FILE_LOCATION,
        dtype={
            "stop_id": int,
            "stop_name": str,
            "stop_desc": str,
            "stop_lat": float,
            "stop_lon": float,
        },
        nrows=max_rows,
    ).fillna("")
    session = SessionLocal()
    existing_ids = session.execute(select(StopModel.id)).scalars().all()

    stops_to_create: list[StopModel] = []
    stops_to_update: list[dict] = []

    bar = progress_bar(total=df.shape[0])
    for _, row in df.iterrows():
        bar.update(1)
        stop = StopModel(
            id=row["stop_id"],
            name=row["stop_name"],
            address=row["stop_desc"],
            latitude=row["stop_lat"],
            longitude=row["stop_lon"],
        )
        if stop.id in existing_ids:
            stops_to_update.append(stop.__dict__)
        else:
            stops_to_create.append(stop)

    print(f"Criando {len(stops_to_create)} paradas na base de dados...")

    if len(stops_to_create) > 0:
        session.add_all(stops_to_create)
        session.commit()

    print(f"Atualizando {len(stops_to_update)} paradas na base de dados...")
    if len(stops_to_update) > 0:
        session.execute(update(StopModel), stops_to_update)
        session.commit()


if __name__ == "__main__":
    create_stops()
