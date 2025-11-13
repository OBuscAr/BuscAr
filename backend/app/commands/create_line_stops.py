from app.core.database import SessionLocal
from app.models import LineDirection, LineModel, LineStopModel, StopModel
from sqlalchemy import select
from tqdm import tqdm as progress_bar

FILE_LOCATION = "app/commands/sptrans_static_data/stop_times.txt"


def create_line_stops() -> None:
    """
    Create line stops from the static SPTrans data.
    """
    with open(FILE_LOCATION, "r") as file:
        file_lines = file.readlines()

    session = SessionLocal()

    existing_line_stop_ids = set(
        session.execute(select(LineStopModel.line_id, LineStopModel.stop_id)).all()
    )
    existing_lines = session.query(LineModel).all()
    lines_by_name_direction: dict[str, str] = {
        f"{line.name}-{LineDirection(line.direction).value - 1}": line.id
        for line in existing_lines
    }

    existing_stop_ids = set(session.execute(select(StopModel.id)).scalars().all())

    line_stops_to_create: list[LineStopModel] = []
    non_existing_lines: set[str] = set()
    non_existing_stops: set[int] = set()
    for file_line in progress_bar(file_lines[1:]):  # Skip the first line
        file_line = file_line[:-1]  # ignore endline at the end
        line_name_direction, _, _, stop_id, stop_order = file_line.split(",")
        line_name_direction = line_name_direction.strip('"')

        if line_name_direction not in lines_by_name_direction:
            if line_name_direction not in non_existing_lines:
                print(f"Linha {line_name_direction} não existe na base de dados")
                non_existing_lines.add(line_name_direction)
            continue

        line_id = lines_by_name_direction[line_name_direction]
        stop_id = int(stop_id.strip('"'))
        stop_order = int(stop_order.strip('"'))

        if stop_id not in existing_stop_ids:
            if stop_id not in non_existing_stops:
                print(f"Parada {stop_id} não existe na base de dados")
                non_existing_stops.add(stop_id)
            continue

        line_stop = LineStopModel(
            line_id=line_id,
            stop_id=stop_id,
            stop_order=stop_order,
        )
        if (line_id, stop_id) not in existing_line_stop_ids:
            line_stops_to_create.append(line_stop)

    print(f"Criando {len(line_stops_to_create)} paradas-linha na base de dados...")

    if len(line_stops_to_create) > 0:
        session.add_all(line_stops_to_create)
        session.commit()


if __name__ == "__main__":
    create_line_stops()
