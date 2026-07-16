from typing import Dict, Any
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, JSON
import uuid

class Sensitivity(SQLModel):
    noise: int = Field(ge=0, le=10, description="0 = tolerant, 10 = extremely sensitive")
    light: int = Field(ge=0, le=10)
    crowd: int = Field(ge=0, le=10)
    movement: int = Field(ge=0, le=10, description="Unpredictable motion / flashing")
    quietExit: bool = Field(description="Needs a low-stimulus egress path")
    serviceAnimal: bool = Field(description="Travels with a support animal")

class SensoryProfileBase(SQLModel):
    preferredLanguage: str = Field(default="en")

class SensoryProfile(SensoryProfileBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    sensitivity: dict = Field(default_factory=dict, sa_column=Column(JSON))

class SensoryProfileCreate(SensoryProfileBase):
    sensitivity: Sensitivity

class SensoryProfileRead(SensoryProfileBase):
    id: str
    sensitivity: Sensitivity
