from pydantic import BaseModel


class SPTransLineStop(BaseModel):
    line_name_direction: str
    stop_id: int
    stop_order: int
