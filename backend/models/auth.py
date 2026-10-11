from datetime import datetime, timezone
import uuid

from pydantic import BaseModel, EmailStr, Field


class StudentSignup(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    student_id: str = Field(min_length=4, max_length=30)
    password: str = Field(min_length=8, max_length=100)


class StudentLogin(BaseModel):
    email: EmailStr
    password: str


class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    student_id: str
    department: str = "Computer Science & Engineering"
    year: str = "B.Tech · 3rd Year"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuthResponse(BaseModel):
    student: Student


class SavedRouteCreate(BaseModel):
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    route_name: str
    minutes: int
    safety_score: int


class SavedRoute(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    route_name: str
    minutes: int
    safety_score: int
    saved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StudentOverview(BaseModel):
    student: Student
    saved_routes: list[SavedRoute]
    report_count: int
    safe_arrivals: int