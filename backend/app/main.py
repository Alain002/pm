import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app import db
from app.ai import router as ai_router
from app.auth import router as auth_router
from app.board import router as board_router

STATIC_DIR = Path(
    os.environ.get("STATIC_DIR", Path(__file__).resolve().parent.parent / "static")
)
STATIC_DIR.mkdir(parents=True, exist_ok=True)

db.init_db()

app = FastAPI(title="PM MVP")
app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SESSION_SECRET", "dev-secret-change-me"),
)
app.include_router(auth_router)
app.include_router(board_router)
app.include_router(ai_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
