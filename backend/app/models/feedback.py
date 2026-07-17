from sqlmodel import SQLModel, Field
from typing import Optional

class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    zone_id: str = Field(index=True)
    direction: str = Field(index=True) # "up" or "down"
    user_id: Optional[int] = Field(default=None, index=True)
    session_id: Optional[str] = Field(default=None, index=True)
