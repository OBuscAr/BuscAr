import datetime

from paginate_sqlalchemy import SqlalchemyOrmPage
from pydantic import TypeAdapter
from sqlalchemy.orm import Session

from app.repositories import daily_line_statistics_repository, myclimate_client
from app.schemas import (
    DailyLineStatistics,
    LineEmissionResponse,
    LinesEmissionsResponse,
    PaginationResponse,
    VehicleType,
)


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
