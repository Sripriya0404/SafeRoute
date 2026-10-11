from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.safety import (
    CampusLocation,
    DashboardResponse,
    EmergencyRequest,
    EmergencyResponse,
    Hazard,
    HazardCreate,
    RouteOption,
    RoutePlan,
    RouteRequest,
    SafetyMetric,
)

router = APIRouter(prefix="/safety", tags=["safety"])

LOCATIONS = [
    CampusLocation(id="library", name="Main Library", short_code="LIB", kind="Study hub", x=22, y=32, description="24/7 study access and staffed help desk"),
    CampusLocation(id="science-quad", name="Science Quad", short_code="SCI", kind="Academic", x=43, y=24, description="North academic corridor"),
    CampusLocation(id="student-union", name="Student Union", short_code="SU", kind="Community", x=59, y=43, description="Food court, student services, and events"),
    CampusLocation(id="north-dorms", name="North Dorms", short_code="ND", kind="Residence", x=78, y=20, description="Residence halls and late-night shuttle stop"),
    CampusLocation(id="engineering", name="Engineering Hall", short_code="ENG", kind="Academic", x=35, y=59, description="Labs and maker spaces"),
    CampusLocation(id="athletics", name="South Athletics", short_code="ATH", kind="Recreation", x=66, y=73, description="Recreation center and south field"),
    CampusLocation(id="west-gate", name="West Gate", short_code="WG", kind="Entry", x=12, y=72, description="Main pedestrian entrance"),
    CampusLocation(id="arts-center", name="Arts Center", short_code="ART", kind="Arts", x=84, y=58, description="Theater, studios, and gallery"),
]

FALLBACK_HAZARDS = [
    Hazard(id="hazard-lighting-01", category="Poor lighting", severity="Medium", location_id="engineering", location_name="Engineering Hall", description="Path lighting is dim between the east doors and service road.", status="Investigating", reported_at=datetime(2026, 2, 18, 21, 10, tzinfo=timezone.utc)),
    Hazard(id="hazard-construction-01", category="Construction", severity="Low", location_id="student-union", location_name="Student Union", description="Temporary fencing narrows the north walkway.", status="Open", reported_at=datetime(2026, 2, 18, 18, 42, tzinfo=timezone.utc)),
    Hazard(id="hazard-blue-light-01", category="Broken blue light", severity="High", location_id="north-dorms", location_name="North Dorms", description="Blue light tower BL-04 is awaiting a replacement part.", status="Open", reported_at=datetime(2026, 2, 17, 23, 6, tzinfo=timezone.utc)),
]


def find_location(location_id: str) -> CampusLocation:
    location = next((item for item in LOCATIONS if item.id == location_id), None)
    if not location:
        raise HTTPException(status_code=404, detail="Campus location not found")
    return location


async def current_hazards(limit: int = 50) -> list[Hazard]:
    records = await db.hazards.find().sort("reported_at", -1).to_list(limit)
    if not records:
        return FALLBACK_HAZARDS
    return [Hazard(**record) for record in records]


@router.get("/locations", response_model=list[CampusLocation])
async def get_locations() -> list[CampusLocation]:
    return LOCATIONS


@router.get("/hazards", response_model=list[Hazard])
async def get_hazards() -> list[Hazard]:
    return await current_hazards()


@router.post("/hazards", response_model=Hazard)
async def create_hazard(payload: HazardCreate) -> Hazard:
    location = find_location(payload.location_id)
    hazard = Hazard(**payload.model_dump(), location_name=location.name)
    await db.hazards.insert_one(hazard.model_dump())
    return hazard


@router.post("/routes/plan", response_model=RoutePlan)
async def plan_route(payload: RouteRequest) -> RoutePlan:
    origin = find_location(payload.origin_id)
    destination = find_location(payload.destination_id)
    if origin.id == destination.id:
        raise HTTPException(status_code=422, detail="Origin and destination must be different")

    options = [
        RouteOption(id="illuminated", name="Illuminated corridor", summary="Best lighting coverage with two blue light towers nearby.", distance_m=620, minutes=8, safety_score=98, lighting_score=96, patrol_status="Patrol monitored", waypoints=[origin.short_code, "BL-02", "SU", destination.short_code]),
        RouteOption(id="fastest", name="Fastest path", summary="A direct route with one low-light segment by the service road.", distance_m=470, minutes=6, safety_score=84, lighting_score=73, patrol_status="Camera monitored", waypoints=[origin.short_code, "QUAD", destination.short_code]),
        RouteOption(id="patrol", name="Patrol corridor", summary="Stay close to the evening escort loop and staffed buildings.", distance_m=760, minutes=10, safety_score=95, lighting_score=91, patrol_status="Escort loop active", waypoints=[origin.short_code, "PATROL-01", "LIB", destination.short_code]),
    ]
    recommended_id = {"safety": "illuminated", "speed": "fastest", "patrol": "patrol"}[payload.priority]
    options.sort(key=lambda option: option.id != recommended_id)
    return RoutePlan(origin=origin, destination=destination, options=options, recommended_id=recommended_id)


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard() -> DashboardResponse:
    hazards = await current_hazards(50)
    # Keep the live feed fresh while preserving the three baseline campus signals
    # that make the demo useful on a newly opened dashboard.
    recent_hazards = hazards[:3]
    recent_ids = {hazard.id for hazard in recent_hazards}
    for baseline in FALLBACK_HAZARDS:
        if baseline.id not in recent_ids and len(recent_hazards) < 5:
            recent_hazards.append(baseline)
    open_count = len([hazard for hazard in hazards if hazard.status != "Resolved"])
    metrics = [
        SafetyMetric(id="coverage", label="Safe path coverage", value="89%", detail="+4% from last week", tone="cyan"),
        SafetyMetric(id="patrols", label="Active patrols", value="06 units", detail="Across 4 campus zones", tone="emerald"),
        SafetyMetric(id="resolved", label="Resolved today", value="14", detail=f"{open_count} reports still open", tone="amber"),
        SafetyMetric(id="escort-eta", label="Average escort ETA", value="04 min", detail="Fastest response this month", tone="crimson"),
    ]
    return DashboardResponse(metrics=metrics, recent_hazards=recent_hazards, campus_status="ALL CLEAR", updated_at=datetime.now(timezone.utc))


@router.post("/emergency", response_model=EmergencyResponse)
async def dispatch_emergency(payload: EmergencyRequest) -> EmergencyResponse:
    location = find_location(payload.location_id)
    response = EmergencyResponse(location_name=location.name, message=payload.message)
    await db.emergency_events.insert_one(response.model_dump())
    return response