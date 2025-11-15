from app.core.database import SessionLocal
from app.models import LineModel, LineStopModel, StopModel
from app.repositories import sptrans_client
from app.schemas import StopSptrans
from sqlalchemy import select, update
from tqdm import tqdm as progress_bar


def create_stops() -> None:
    """
    Create stops from the SPTrans API. Also link lines with their stops.
    """
    user = sptrans_client.login()
    session = SessionLocal()
    line_ids = session.execute(select(LineModel.id)).scalars().all()

    stops_by_line: dict[int, list[StopSptrans]] = {}

    stops: list[StopSptrans] = []
    stop_ids: set[int] = set()

    for line_id in progress_bar(line_ids):
        stops_by_line[line_id] = sptrans_client.get_stops_by_line(
            credentials=user,
            line_id=line_id,
        )
        for stop in stops_by_line[line_id]:
            if stop.id not in stop_ids:
                stops.append(stop)
                stop_ids.add(stop.id)

    existing_stop_ids = session.execute(select(StopModel.id)).scalars().all()

    stops_to_create: list[StopModel] = []
    stops_to_update: list[dict] = []
    for stop in stops:
        stop_model = StopModel(
            id=stop.id,
            name=stop.name if stop.name else stop.address,
            address=stop.address,
            latitude=stop.latitude,
            longitude=stop.longitude,
        )
        if stop.id in existing_stop_ids:
            stops_to_update.append(stop_model.__dict__)
        else:
            stops_to_create.append(stop_model)

    print(f"Criando {len(stops_to_create)} paradas na base de dados...")

    if len(stops_to_create) > 0:
        session.add_all(stops_to_create)
        session.commit()

    print(f"Atualizando {len(stops_to_update)} paradas na base de dados...")
    if len(stops_to_update) > 0:
        session.execute(update(StopModel), stops_to_update)
        session.commit()

    existing_line_stop_ids = set(
        session.execute(select(LineStopModel.line_id, LineStopModel.stop_id)).all()
    )

    line_stops: list[LineStopModel] = []
    for line_id, stops in stops_by_line.items():
        line_stops.extend(
            [
                LineStopModel(line_id=line_id, stop_id=stop.id)
                for stop in stops
                if (line_id, stop.id) not in existing_line_stop_ids
            ]
        )

    print(f"Criando {len(line_stops)} paradas-linhas na base de dados...")
    session.add_all(line_stops)
    session.commit()


if __name__ == "__main__":
    create_stops()
