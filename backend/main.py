from core.instrumentation import setup as _setup_arize
_setup_arize()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers import intake, recommend, apply_now, chat, calfresh, checklist, demo, deadlines, evaluate

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
app.include_router(deadlines.router, tags=["deadlines"])
app.include_router(evaluate.router, tags=["evaluate"])


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.model_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
