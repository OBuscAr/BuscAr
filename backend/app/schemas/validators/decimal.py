from typing import Annotated

from pydantic import AfterValidator


def round_to(decimal_places: int, /) -> AfterValidator:
    return AfterValidator(lambda v: round(v, decimal_places))


DefaultRoundedFloat = Annotated[float, round_to(2)]
