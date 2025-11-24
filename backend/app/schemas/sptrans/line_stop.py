from pydantic import BaseModel


class SPTransLineStop(BaseModel):
    trip_id: str
    stop_id: int
    stop_order: int
