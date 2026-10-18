# Project Plan: Project Management MVP

## Locked decisions

- Single Docker container: FastAPI serves the statically exported Next.js frontend at `/`, API under `/api`, port 8000.
- Next.js static export (`output: 'export'`); no Next server in the container.
- Auth: hardcoded `user` / `password`; HttpOnly session cookie (Starlette `SessionMiddleware`). SQLite `users` table seeded with this user so multi-user is future-ready.
- Database: SQLite file, created automatically if missing. Board state stored as a JSON blob per user, mirroring the frontend `BoardData` shape. Schema documented in docs/DATABASE.md.
- AI: OpenRouter, model `openai/gpt-oss-120b`, key from `OPENROUTER_API_KEY` in `.env`. Structured Outputs (JSON schema) for chat.
- Board rules: exactly 5 fixed columns; columns renamable but not addable/deletable. Cards can be created, edited, moved, deleted.
- Scripts: `scripts/start.sh|stop.sh` (Mac/Linux), `scripts/start.bat|stop.bat` (PC) build/run/stop the container.
- Tests: backend `pytest` (run in Docker), frontend `vitest`, Playwright e2e against the full stack on port 8000.
- Plan approval and DB schema sign-off: granted in advance by the user.

## Part 1: Plan

- [x] Enrich PLAN.md with per-part checklists, tests, success criteria
- [x] Create frontend/AGENTS.md describing the existing code
- Success criteria: plan reviewed; approved in advance by user.

## Part 2: Scaffolding

- [x] backend/pyproject.toml (FastAPI, uvicorn, pytest; uv-managed)
- [x] backend/app/main.py: FastAPI app serving a hello-world static index.html at `/` plus `GET /api/health`
- [x] Dockerfile (multi-stage; python:3.13-slim runtime with uv)
- [x] .dockerignore
- [x] scripts/start.sh, stop.sh, start.bat, stop.bat
- Tests: pytest health check; manual curl of `/` and `/api/health` against running container — all passed 2026-10-12
- Success criteria: start script builds and runs container; `localhost:8000/` returns HTML, `/api/health` returns JSON; stop script stops it.

## Part 3: Add in Frontend

- [x] next.config.ts: `output: 'export'`
- [x] Dockerfile stage 1: `npm ci` + `next build` -> `out/`, copied into runtime image
- [x] FastAPI serves `out/` at `/`
- Tests: existing vitest suite (green); Playwright e2e repointed at port 8000 (green)
- Success criteria: demo Kanban board renders from the container at `/`; e2e green.

## Part 4: Fake user sign in

- [x] `POST /api/login`, `POST /api/logout`, `GET /api/me`; SessionMiddleware with `SESSION_SECRET` env (dev default)
- [x] Frontend: client-side gate — unauthenticated users see a login form; authenticated see the board; logout button
- Tests: pytest auth flow (login ok/bad, me, logout) green; vitest login form green; Playwright login/logout green
- Success criteria: `/` requires login with `user`/`password`; logout returns to login form.

## Part 5: Database modeling

- [x] docs/DATABASE.md: `users(id, username, password)`, `boards(user_id, data JSON, updated_at)`; rationale for JSON blob (matches `BoardData`, simple, multi-user ready)
- Success criteria: schema documented; sign-off granted in advance by user.

## Part 6: Backend

- [x] db.py: sqlite3 stdlib; init schema, seed user, seed default board if missing
- [x] `GET /api/board`, `PUT /api/board` (full-board replace, Pydantic-validated), auth required
- Tests: pytest — 401 unauthenticated, get default board, put round-trip persists, invalid payload 422 — all green; curl round-trip verified in container
- Success criteria: board read/write via API verified by tests.

## Part 7: Frontend + Backend

- [x] frontend API client (fetch wrapper); Workspace loads board from API on mount, persists on every mutation
- [x] loading and error states
- Tests: vitest with mocked fetch (green); Playwright persistence test (green)
- Success criteria: board persists across reloads; all tests green.

## Part 8: AI connectivity

- [x] ai.py: OpenRouter client (httpx); `GET /api/ai/ping` asks the model "2+2" and returns the answer; 503 if no key
- Tests: pytest with mocked httpx (green); live ping verified 2026-10-12 — returned `{"answer":"4"}`
- Success criteria: "2+2" call returns a response containing "4".

## Part 9: Structured outputs

- [x] `POST /api/chat {message, history}`: sends system prompt + current board JSON + history to the model
- [x] Structured Outputs JSON schema: `{reply: string, board: BoardData | null}`; if board returned, validate and persist it
- Tests: pytest with mocked OpenRouter for reply-only, board-update, and invalid-response cases (green); live call verified — renamed a column and persisted
- Success criteria: chat answers questions and can update the board via structured output, verified by tests.

## Part 10: Chat sidebar

- [x] ChatSidebar component: right-side panel, message list, input, conversation history kept client-side
- [x] On response: render reply; if board was updated, refresh the board UI automatically
- [x] Styling per color scheme (purple submit, blue accents, navy headings)
- Tests: vitest sidebar interaction (green); Playwright chat flow against live AI (green)
- Success criteria: full chat loop works in the browser; board refreshes on AI updates.

## Final

- [x] Minimal root README.md (run instructions)
- [x] Full `docker build` green; backend pytest (18) and frontend vitest (20) green
- [x] Playwright e2e green against the container — 8/8 passed 2026-10-12 (chromium project uses local Edge via `channel: "msedge"`; serial workers + per-test board reset for determinism)