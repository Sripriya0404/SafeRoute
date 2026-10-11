import asyncio

from lib.db import db, ensure_indexes
from routers.safety import FALLBACK_HAZARDS


async def seed() -> None:
    for hazard in FALLBACK_HAZARDS:
        await db.hazards.update_one({"id": hazard.id}, {"$set": hazard.model_dump()}, upsert=True)
    await ensure_indexes()
    print("SafeRoute demo data ready")


if __name__ == "__main__":
    asyncio.run(seed())