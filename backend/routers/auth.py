from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import os
import secrets

from fastapi import APIRouter, Cookie, HTTPException, Response

from lib.db import db
from models.auth import AuthResponse, SavedRoute, SavedRouteCreate, Student, StudentLogin, StudentOverview, StudentSignup

router = APIRouter(prefix="/auth", tags=["auth"])
SESSION_COOKIE = "saferoute_session"


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), actual_salt.encode(), 120_000).hex()
    return actual_salt, digest


def public_student(record: dict) -> Student:
    return Student(**{key: value for key, value in record.items() if key not in {"_id", "password_hash", "password_salt"}})


async def require_student(token: str | None) -> Student:
    if not token:
        raise HTTPException(status_code=401, detail="Sign in required")
    session = await db.sessions.find_one({"token": token, "expires_at": {"$gt": datetime.now(timezone.utc)}})
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    record = await db.students.find_one({"id": session["student_id"]})
    if not record:
        raise HTTPException(status_code=401, detail="Student not found")
    return public_student(record)


async def create_session(response: Response, student_id: str) -> None:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({"token": token, "student_id": student_id, "expires_at": expires})
    response.set_cookie(SESSION_COOKIE, token, max_age=604800, httponly=True, secure=os.environ.get("APP_URL", "").startswith("https://"), samesite="lax", path="/")


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: StudentSignup, response: Response) -> AuthResponse:
    email = payload.email.lower()
    if await db.students.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account already exists for this email")
    salt, digest = hash_password(payload.password)
    student = Student(name=payload.name, email=email, student_id=payload.student_id)
    await db.students.insert_one({**student.model_dump(), "password_salt": salt, "password_hash": digest})
    await create_session(response, student.id)
    return AuthResponse(student=student)


@router.post("/login", response_model=AuthResponse)
async def login(payload: StudentLogin, response: Response) -> AuthResponse:
    record = await db.students.find_one({"email": payload.email.lower()})
    if not record:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _, digest = hash_password(payload.password, record["password_salt"])
    if not hmac.compare_digest(digest, record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    student = public_student(record)
    await create_session(response, student.id)
    return AuthResponse(student=student)


@router.get("/me", response_model=AuthResponse | None)
async def me(saferoute_session: str | None = Cookie(default=None)) -> AuthResponse | None:
    if not saferoute_session:
        return None
    try:
        return AuthResponse(student=await require_student(saferoute_session))
    except HTTPException:
        return None


@router.post("/logout", status_code=204)
async def logout(response: Response, saferoute_session: str | None = Cookie(default=None)) -> Response:
    if saferoute_session:
        await db.sessions.delete_one({"token": saferoute_session})
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


@router.get("/overview", response_model=StudentOverview)
async def overview(saferoute_session: str | None = Cookie(default=None)) -> StudentOverview:
    student = await require_student(saferoute_session)
    routes = await db.saved_routes.find({"student_id": student.id}).sort("saved_at", -1).to_list(20)
    report_count = await db.hazards.count_documents({"reporter_id": student.id})
    safe_arrivals = await db.arrivals.count_documents({"student_id": student.id})
    return StudentOverview(student=student, saved_routes=[SavedRoute(**route) for route in routes], report_count=report_count, safe_arrivals=safe_arrivals)


@router.post("/saved-routes", response_model=SavedRoute)
async def save_route(payload: SavedRouteCreate, saferoute_session: str | None = Cookie(default=None)) -> SavedRoute:
    student = await require_student(saferoute_session)
    saved = SavedRoute(student_id=student.id, **payload.model_dump())
    await db.saved_routes.insert_one(saved.model_dump())
    return saved


@router.post("/arrivals", status_code=204)
async def record_arrival(saferoute_session: str | None = Cookie(default=None)) -> None:
    student = await require_student(saferoute_session)
    await db.arrivals.insert_one({"student_id": student.id, "arrived_at": datetime.now(timezone.utc)})