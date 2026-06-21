import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.services import redis_cache, redis_memory
from agents.services.redis_seed import seed_if_needed
from agents.services.redis_store import index_stats
from core.config import settings
from routers import (
    apply_now,
    calfresh,
    chat,
    checklist,
    contribute,
    demo,
    intake,
    recommend,
    web_search,
)

logger = logging.getLogger("jugaad.main")

app = FastAPI(title="Jugaad API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/intake", tags=["intake"])
app.include_router(recommend.router, tags=["recommend"])
app.include_router(apply_now.router, tags=["apply"])
app.include_router(chat.router, tags=["chat"])
app.include_router(calfresh.router, tags=["calfresh"])
app.include_router(checklist.router, tags=["checklist"])
app.include_router(demo.router, prefix="/demo", tags=["demo"])
app.include_router(contribute.router, tags=["data"])
app.include_router(web_search.router, tags=["data"])


@app.on_event("startup")
def _startup_seed() -> None:
    """Idempotent RedisVL seed on every boot — only writes when index is empty."""
    try:
        result = seed_if_needed()
        logger.info("Redis seed result: %s", result)
    except Exception as exc:
        logger.warning("Redis seed at startup failed: %s", exc)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": settings.model_name,
        "data_layer": {
            "redis_vector_index": index_stats(),
            "langcache": redis_cache.stats(),
            "agent_memory": redis_memory.stats(),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
