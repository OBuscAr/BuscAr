from app.core.database import SessionLocal
from app.models import StopModel
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar

FILE_LOCATION = "app/commands/sptrans_static_data/stops.txt"


def create_stops() -> None:
    """
    Create stops from the static SPTrans data.
    """
    with open(FILE_LOCATION, "r") as file:
        file_lines = file.readlines()

    session = SessionLocal()
    existing_ids = session.execute(select(StopModel.id)).scalars().all()

    stops_to_create: list[StopModel] = []
    stops_to_update: list[dict] = []
    for file_line in progress_bar(file_lines[1:]):  # Skip the first line
        id, rest = file_line.split(",", maxsplit=1)
        _, name, _, description, rest = rest.split('"', maxsplit=4)
        _, latitude, longitude = rest.split(",")
        id = int(id)
        latitude = float(latitude)
        longitude = float(longitude)
        stop = StopModel(
            id=id,
            name=name,
            address=description,
            latitude=latitude,
            longitude=longitude,
        )
        if id in existing_ids:
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
