from datetime import datetime, timezone
from typing import Literal
import uuid

from pydantic import BaseModel, Field


HazardCategory = Literal[
    "Poor lighting",
    "Broken blue light",
    "Construction",
    "Suspicious activity",
]
HazardSeverity = Literal["Low", "Medium", "High"]


class CampusLocation(BaseModel):
    id: str
    name: str
    short_code: str
    kind: str
    x: int
    y: int
    description: str


class HazardCreate(BaseModel):
    category: HazardCategory
    severity: HazardSeverity
    location_id: str
    description: str = Field(min_length=5, max_length=500)


class Hazard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: HazardCategory
    severity: HazardSeverity
    location_id: str
    location_name: str
    description: str
    status: Literal["Open", "Investigating", "Resolved"] = "Open"
    reporter_id: str | None = None
    reported_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RouteRequest(BaseModel):
    origin_id: str
    destination_id: str
    priority: Literal["safety", "speed", "patrol"] = "safety"


class RouteOption(BaseModel):
    id: str
    name: str
    summary: str
    distance_m: int
    minutes: int
    safety_score: int
    lighting_score: int
    patrol_status: str
    waypoints: list[str]


class RoutePlan(BaseModel):
    origin: CampusLocation
    destination: CampusLocation
    options: list[RouteOption]
    recommended_id: str


class SafetyMetric(BaseModel):
    id: str
    label: str
    value: str
    detail: str
    tone: Literal["cyan", "emerald", "amber", "crimson"]


class DashboardResponse(BaseModel):
    metrics: list[SafetyMetric]
    recent_hazards: list[Hazard]
    campus_status: str
    updated_at: datetime


class EmergencyRequest(BaseModel):
    location_id: str
    message: str = Field(default="Student requested immediate campus safety assistance.", max_length=300)


class EmergencyResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["Dispatched"] = "Dispatched"
    location_name: str
    message: str
    eta_minutes: int = 3
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))