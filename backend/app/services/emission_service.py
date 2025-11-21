import datetime
from datetime import timedelta

from paginate_sqlalchemy import SqlalchemyOrmPage
from pydantic import TypeAdapter
from sqlalchemy.orm import Session

from app.constants import SAO_PAULO_ZONE
from app.exceptions import ValidationError
from app.repositories import daily_line_statistics_repository, myclimate_client
from app.schemas import (
    DailyLineStatistics,
    EmissionResponse,
    EmissionStatisticsReponse,
    LineEmissionResponse,
    LinesEmissionsResponse,
    PaginationResponse,
    VehicleType,
)
from app.services import distance_service


def get_emission_lines_ranking(
    date: datetime.date,
    page: int,
    page_size: int,
    db: Session,
) -> LinesEmissionsResponse:
    """
    Return the ranking of the lines ordered by decreasing carbon emission.

    Parameters:
    - `date`: To filter results by this date.
    - `page_size` and `page`: results will be divided in blocks of `page_size`
       and the function will return the `page`-th block.
    """
    queryset = daily_line_statistics_repository.get_ordered_daily_line_statistics(
        date=date,
        db=db,
    )
    paginated_results = SqlalchemyOrmPage(queryset, items_per_page=page_size, page=page)
    lines_statistics = TypeAdapter(list[DailyLineStatistics]).validate_python(
        paginated_results.items
    )
    return LinesEmissionsResponse(
        lines_emissions=[
            LineEmissionResponse(
                line=line_statistics.line,
                emission=myclimate_client.calculate_carbon_emission(
                    distance=line_statistics.distance_traveled,
                    vehicle_type=VehicleType.BUS,
                ),
            )
            for line_statistics in lines_statistics
        ],
        pagination=PaginationResponse(
            total_count=paginated_results.item_count,
            page_count=paginated_results.page_count,
        ),
    )


def get_line_emission_statistics(
    db: Session,
    start_date: datetime.date,
    days_range: int,
    line_id: int,
) -> list[EmissionStatisticsReponse]:
    """
    Return the accumulate emissions of the given line for each date
    in the range from `start_date` to `days_range` after that.
    """
    today = datetime.datetime.now(tz=SAO_PAULO_ZONE).date()
    if start_date > today:
        raise ValidationError("start_date cannot be in the future")

    end_date = start_date + timedelta(days=days_range - 1)
    end_date = min(end_date, today)

    queryset = daily_line_statistics_repository.get_daily_line_statistics(
        db=db,
        minimum_date=start_date,
        maximum_date=end_date,
        line_id=line_id,
    )
    daily_lines_statistics = TypeAdapter(list[DailyLineStatistics]).validate_python(
        queryset
    )

    return [
        EmissionStatisticsReponse(
            total_emission=myclimate_client.calculate_carbon_emission(
                distance=line_statistics.distance_traveled,
                vehicle_type=VehicleType.BUS,
            ),
            date=line_statistics.date,
        )
        for line_statistics in daily_lines_statistics
    ]


def get_emission_statistics(
    start_date: datetime.date,
    days_range: int,
    db: Session,
) -> list[EmissionStatisticsReponse]:
    """
    Return the accumulated emissions of all the SPTrans lines for each date
    in the range from `start_date` to `days_range` after that. The results
    will be ordered by date.
    """
    today = datetime.datetime.now(tz=SAO_PAULO_ZONE).date()
    if start_date > today:
        raise ValidationError("start_date cannot be in the future")

    end_date = start_date + timedelta(days=days_range - 1)
    end_date = min(end_date, today)

    raw_distance_statistics = daily_line_statistics_repository.get_daily_statistics(
        db=db, minimum_date=start_date, maximum_date=end_date
    ).all()

    return [
        EmissionStatisticsReponse(
            date=date,
            total_emission=myclimate_client.calculate_carbon_emission(
                distance=distance,
                vehicle_type=VehicleType.BUS,
            ),
        )
        for date, distance in raw_distance_statistics
    ]


def calculate_emission_stops(
    line_id: int,
    stop_id_a: int,
    stop_id_b: int,
    db: Session,
) -> EmissionResponse:
    """
    Calculate the carbon emissions between two coordinate stops
    for a BUS vehicle.
    """
    distance_ab_km = distance_service.calculate_distance_between_stops(
        db=db,
        line_id=line_id,
        stop_a_id=stop_id_a,
        stop_b_id=stop_id_b,
    )

    # Chama o serviço MyClimate
    emission_calculate_kg = myclimate_client.calculate_carbon_emission(
        distance=distance_ab_km,
        vehicle_type=VehicleType.BUS,
    )

    return EmissionResponse(
        distance_km=distance_ab_km,
        emission_kg_co2=emission_calculate_kg,
    )
