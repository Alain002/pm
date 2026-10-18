# Backend

FastAPI app serving the PM MVP: static frontend at `/`, JSON API under `/api`.

## Stack

- Python 3.13, FastAPI, uvicorn; deps managed with uv (`pyproject.toml` + `uv.lock`)
- SQLite via stdlib `sqlite3`; board stored as JSON per user (see docs/DATABASE.md)
- httpx for OpenRouter calls; Starlette SessionMiddleware (itsdangerous) for auth cookies

## Structure

- app/main.py — app factory: session middleware, routers, static mount (`STATIC_DIR` env, default backend/static; created if missing), `db.init_db()` on startup
- app/auth.py — `POST /api/login`, `POST /api/logout`, `GET /api/me`; credentials checked against the users table
- app/board.py — `GET/PUT /api/board` (auth required); Pydantic-validated board
- app/ai.py — `GET /api/ai/ping` (2+2 connectivity check) and `POST /api/chat` (OpenRouter `openai/gpt-oss-120b`, structured output `{reply, board|null}`; board updates are validated and persisted)
- app/db.py — connection helpers, schema init, seed user + default board, `DEFAULT_BOARD`
- app/models.py — `Card`, `Column`, `BoardData` Pydantic models (extra=forbid)
- tests/ — pytest; `conftest.py` sets temp `STATIC_DIR` and `DATABASE_PATH` before importing the app

## Configuration

Env vars: `OPENROUTER_API_KEY` (required for /api/chat and /api/ai/ping), `SESSION_SECRET` (defaults to a dev value), `DATABASE_PATH`, `STATIC_DIR`.

## Tests

No Python on the host is assumed; run in Docker:

```sh
docker run --rm -v "<repo>\backend:/app" -w /app python:3.13-slim sh -c "pip install -q uv && uv sync -q --frozen && .venv/bin/python -m pytest -q"
```

The uv.lock was generated the same way (`uv lock` instead of sync/pytest).