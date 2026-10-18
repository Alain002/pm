# PM MVP

Kanban project management app: Next.js static frontend + FastAPI backend + SQLite, packaged as a single Docker container, with an AI chat sidebar powered by OpenRouter.

## Run

Prerequisites: Docker Desktop. Optional: `.env` in the project root with `OPENROUTER_API_KEY=...` for the AI features.

- Windows: `scripts\start.bat`
- Mac/Linux: `sh scripts/start.sh`

App runs at http://localhost:8000. Sign in with `user` / `password`.

Stop with `scripts\stop.bat` / `sh scripts/stop.sh`.

## Develop

- Backend tests: run pytest in a Python container (see backend/AGENTS.md)
- Frontend: `npm --prefix frontend run test` (unit), `npm --prefix frontend run test:e2e` (Playwright, requires the container running on port 8000)

See docs/PLAN.md and docs/DATABASE.md for architecture notes.
