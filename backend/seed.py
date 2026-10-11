import asyncio

from lib.db import db, ensure_indexes
from models.auth import Student
from routers.auth import hash_password
from routers.safety import FALLBACK_HAZARDS


async def seed() -> None:
    for hazard in FALLBACK_HAZARDS:
        await db.hazards.update_one({"id": hazard.id}, {"$set": hazard.model_dump()}, upsert=True)
    if not await db.students.find_one({"email": "student@anurag.edu.in"}):
        salt, digest = hash_password("SafeRoute@2026")
        student = Student(id="demo-anurag-student", name="Aarav Reddy", email="student@anurag.edu.in", student_id="AU21CSE042")
        await db.students.insert_one({**student.model_dump(), "password_salt": salt, "password_hash": digest})
    await ensure_indexes()
    print("SafeRoute demo data ready")


if __name__ == "__main__":
    asyncio.run(seed())