from pydantic import BaseModel


class PaginationResponse(BaseModel):
    total_count: int
    page_count: int
