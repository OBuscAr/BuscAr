import pytest
from app.schemas import Point
from app.services.distance_service import find_closest_point


class IdPoint(Point):
    id: int


def test_no_points():
    """
    GIVEN  an empty list and a target point
    WHEN   the `find_closest_point` function is called
    THEN   a null value should be returned
    """
    # GIVEN
    points = []

    # WHEN
    closest_point = find_closest_point(
        points=points, target_point=Point(latitude=0, longitude=0)
    )

    # THEN
    assert closest_point is None


@pytest.mark.parametrize(
    "points, target_point, expected_index",
    [
        ([IdPoint(id=1, latitude=0, longitude=0)], Point(latitude=10, longitude=10), 0),
        (
            [
                IdPoint(id=1, latitude=0, longitude=0),
                IdPoint(id=2, latitude=10, longitude=10),
                IdPoint(id=3, latitude=10, longitude=10),
            ],
            Point(latitude=10, longitude=10),
            1,
        ),
        (
            [
                # Pça. Vicente Rodrigues
                IdPoint(id=0, latitude=-23.568559, longitude=-46.708164),
                # Av. Afrânio Peixoto, 332
                IdPoint(id=1, latitude=-23.566086, longitude=-46.710496),
                # Economia E Administração
                IdPoint(id=2, latitude=-23.558951, longitude=-46.729803),
                # Reitoria
                IdPoint(id=3, latitude=-23.560157, longitude=-46.727336),
                # Instituto Butantã
                IdPoint(id=4, latitude=-23.563603, longitude=-46.716266),
            ],
            Point(latitude=-23.562368, longitude=-46.723045),  # Brasiliana
            3,
        ),
        (
            [
                IdPoint(id=0, latitude=40, longitude=10),
                IdPoint(id=1, latitude=10, longitude=40),
            ],
            Point(latitude=10, longitude=10),
            1,
        ),
    ],
)
def test_nearest_point(
    points: list[IdPoint],
    target_point: Point,
    expected_index: int,
):
    """
    GIVEN  a list of points and a target point
    WHEN   the `find_closest_point` function is called
    THEN   the closest point to the target point should be returned
    """
    # GIVEN
    expected_point = points[expected_index]

    # WHEN
    closest_point = find_closest_point(points=points, target_point=target_point)

    # THEN
    assert closest_point == expected_point
