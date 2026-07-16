from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ZoneCoordinates(BaseModel):
    x: float
    y: float

class Zone(BaseModel):
    zoneId: str = Field(pattern="^[A-Z0-9_-]+$")
    type: str
    name: str = Field(min_length=1)
    coordinates: ZoneCoordinates
    capacitySqm: float = Field(ge=0)
    adjacentZones: List[str] = Field(default_factory=list)
    walkTimeSeconds: int = Field(ge=0, default=0)

class SensorySignal(BaseModel):
    zoneId: str = Field(pattern="^[A-Z0-9_-]+$")
    timestamp: datetime
    noiseDb: float = Field(ge=30, le=130)
    crowdDensity: float = Field(ge=0, le=10)
    lightLevel: float = Field(ge=0, le=1000)

class MatchConfig(BaseModel):
    matchId: str = Field(pattern="^[A-Z0-9_-]+$")
    venueId: str = Field(pattern="^[A-Z0-9_-]+$")
    kickoffTime: datetime
    gatesOpenTime: datetime
    expectedAttendance: int = Field(ge=0)

class StadiumDataset(BaseModel):
    zones: List[Zone] = Field(min_length=1)
    signals: List[SensorySignal] = Field(min_length=1)
    match: MatchConfig
