import logging
import time
from datetime import datetime, timedelta
from typing import Sequence
from zoneinfo import ZoneInfo

import schedule
from geopy import distance
from requests.cookies import RequestsCookieJar
from sqlalchemy import update
from tqdm import tqdm as progress_bar

from app.core.database import SessionLocal
from app.models import DailyLineStatisticsModel, LineModel, VehicleModel
from app.repositories import sptrans_client
from app.schemas import SPTransLineVehiclesResponse

logger = logging.getLogger(__name__)

MAXIMUM_ELAPSED_TIME_TO_UPDATE = timedelta(minutes=10)


def update_vehicle_positions(
    lines_vehicles: Sequence[SPTransLineVehiclesResponse],
) -> dict[int, float]:
    """
    Update the vehicle positions and return the difference in distance traveled
    for each line.
    """
    logger.info(f"Analizando {len(lines_vehicles)} linhas com veículos...")

    session = SessionLocal()
    vehicles_ids: list[int] = []

    for line_vehicles in lines_vehicles:
        vehicles_ids.extend(vehicle.id for vehicle in line_vehicles.vehicles)

    database_vehicles = {
        vehicle.id: vehicle
        for vehicle in session.query(VehicleModel).filter(
            VehicleModel.id.in_(vehicles_ids)
        )
    }

    vehicles_to_create: list[VehicleModel] = []
    vehicles_to_update: list[dict] = []
    processed_vehicles: dict[int, VehicleModel] = {}
    delta_distances: dict[int, float] = {}

    for line_vehicles in progress_bar(lines_vehicles):
        line_id = line_vehicles.line_id
        if session.query(LineModel).filter_by(id=line_id).first() is None:
            logger.info(
                f"A linha {line_id} com nome {line_vehicles.line_name} não existe "
                "na base de dados. Seus veículos serão ignorados"
            )
            continue

        for vehicle in line_vehicles.vehicles:
            vehicle_model = VehicleModel(
                id=vehicle.id,
                latitude=vehicle.latitude,
                longitude=vehicle.longitude,
                line_id=line_id,
                updated_at=vehicle.updated_at,
            )
            if vehicle.id in processed_vehicles:
                other_line_id = processed_vehicles[vehicle.id].line_id
                if vehicle.id != other_line_id:
                    logger.warning(
                        f"O ônibus {vehicle.id} apareceu para a linha {other_line_id}. "
                        f"Será ignorado para a linha {line_id}"
                    )
                    continue
                else:
                    logger.warning(
                        f"O ônibus {vehicle.id} apareceu duplicado na linha {line_id}"
                    )
                    continue

            processed_vehicles[vehicle.id] = vehicle_model

            if vehicle.id not in database_vehicles:
                vehicles_to_create.append(vehicle_model)
            else:
                previous_updated_at = database_vehicles[vehicle.id].updated_at
                elapsed_time = vehicle.updated_at - previous_updated_at
                if (
                    elapsed_time <= MAXIMUM_ELAPSED_TIME_TO_UPDATE
                    and previous_updated_at != vehicle.updated_at
                    and line_id == database_vehicles[vehicle.id].line_id
                ):
                    if line_id not in delta_distances:
                        delta_distances[line_id] = 0

                    old_position = (
                        database_vehicles[vehicle.id].latitude,
                        database_vehicles[vehicle.id].longitude,
                    )
                    new_position = (vehicle.latitude, vehicle.longitude)
                    delta_distances[line_id] += distance.distance(
                        old_position, new_position
                    ).kilometers
                vehicles_to_update.append(vehicle_model.dict())

    logger.info(f"Criando {len(vehicles_to_create)} veículos na base de dados...")

    if len(vehicles_to_create) > 0:
        session.add_all(vehicles_to_create)
        session.commit()

    logger.info(f"Atualizando {len(vehicles_to_update)} veículos na base de dados...")
    if len(vehicles_to_update) > 0:
        session.execute(update(VehicleModel), vehicles_to_update)
        session.commit()

    return delta_distances


def update_daily_line_statistics(
    credentials: RequestsCookieJar,
    raise_exception: bool = True,
) -> None:
    """
    Update the daily line statistics of the vehicles currently moving.
    """
    start_time = time.perf_counter()
    try:
        lines_vehicles = sptrans_client.get_live_vehicles_positions(
            credentials=credentials
        ).lines_vehicles

        lines_statistics = update_vehicle_positions(lines_vehicles)

        session = SessionLocal()
        today = datetime.now(tz=ZoneInfo("America/Sao_Paulo")).date()

        database_statistics = {
            line_statistics.line_id: line_statistics
            for line_statistics in session.query(DailyLineStatisticsModel)
            .filter_by(date=today)
            .filter(DailyLineStatisticsModel.line_id.in_(lines_statistics.keys()))
        }
        statistics_to_create: list[VehicleModel] = []
        statistics_to_update: list[dict] = []
        for line_id, distance_traveled in lines_statistics.items():
            if line_id in database_statistics:
                distance_traveled += database_statistics[line_id].distance_traveled
            statistics_model = DailyLineStatisticsModel(
                line_id=line_id,
                date=today,
                distance_traveled=distance_traveled,
            )

            if line_id not in database_statistics:
                statistics_to_create.append(statistics_model)
            else:
                statistics_to_update.append(statistics_model.dict())

        logger.info(
            f"Criando {len(statistics_to_create)} estatísticas na base de dados..."
        )

        if len(statistics_to_create) > 0:
            session.add_all(statistics_to_create)
            session.commit()

        logger.info(
            f"Atualizando {len(statistics_to_update)} estatísticas na base de dados..."
        )
        if len(statistics_to_update) > 0:
            session.execute(update(DailyLineStatisticsModel), statistics_to_update)
            session.commit()

        elapsed_time = time.perf_counter() - start_time
        logger.info(f"O cron terminou depois de {elapsed_time:.2f} segundos")
    except Exception as e:
        if raise_exception:
            raise e
        else:
            elapsed_time = time.perf_counter() - start_time
            logger.exception(
                f"O cron falhou depois de {elapsed_time:.2f} segundos",
                exc_info=True,
                stack_info=True,
            )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    MAIN_TAG = "main"

    def reschedule_main_job() -> None:
        logger.info("Reagendando job com novas credenciais de SPTrans")
        schedule.clear(MAIN_TAG)
        schedule.every(10).seconds.do(
            update_daily_line_statistics,
            credentials=sptrans_client.login(),
            raise_exception=False,
        ).tag(MAIN_TAG)

    update_daily_line_statistics(
        credentials=sptrans_client.login(), raise_exception=False
    )
    reschedule_main_job()
    schedule.every(10).minutes.do(reschedule_main_job)

    while True:
        schedule.run_pending()
        time.sleep(1)
