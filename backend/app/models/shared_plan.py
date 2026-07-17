from sqlmodel import SQLModel, Field
from typing import Optional

class SharedPlan(SQLModel, table=True):
    short_id: str = Field(primary_key=True, index=True)
    gate_name: str
    arrival_window: str
    reset_zone_name: str
    reasoning: str
    user_id: Optional[int] = Field(default=None, index=True)
