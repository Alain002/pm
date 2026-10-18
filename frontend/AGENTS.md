# Frontend

Next.js 16 (App Router) + React 19 single-board Kanban app, built as a static export (`output: 'export'` in next.config.ts) and served by the FastAPI backend at `/`. All data flows through the backend API — see docs/PLAN.md.

## Stack

- Next.js 16.1, React 19.2, TypeScript 5, Tailwind CSS 4
- dnd-kit (`@dnd-kit/core` + `@dnd-kit/sortable`) for drag and drop
- Vitest + Testing Library (unit), Playwright (e2e)

## Structure

- src/app/page.tsx — renders `AppGate`
- src/app/layout.tsx — fonts (Space Grotesk display, Manrope body via next/font), metadata
- src/app/globals.css — Tailwind import + CSS variables for the color scheme
- src/lib/kanban.ts — `Card`, `Column`, `BoardData` types; `initialData` fixture; `moveCard` drag logic; `createId`
- src/lib/api.ts — `fetchBoard` / `saveBoard` wrappers around `/api/board`
- src/components/AppGate.tsx — auth gate: checks `/api/me`, loads the board, shows `LoginForm` / loading / error+retry / `Workspace`
- src/components/LoginForm.tsx — sign-in form posting to `/api/login`
- src/components/Workspace.tsx — owns board state; persists every change via `saveBoard`; renders board + `ChatSidebar`
- src/components/KanbanBoard.tsx — controlled board (`board`, `onBoardChange`); DndContext + DragOverlay; optional `onLogout` button
- src/components/KanbanColumn.tsx — droppable column; inline rename input; SortableContext; hosts NewCardForm
- src/components/KanbanCard.tsx — sortable card with Remove button
- src/components/KanbanCardPreview.tsx — drag overlay preview card
- src/components/NewCardForm.tsx — expandable add-card form (title + details)
- src/components/ChatSidebar.tsx — AI chat panel (`POST /api/chat`); applies `board` updates via `onBoardUpdate`; collapsible
- Unit tests live next to the code (`*.test.ts(x)`)
- tests/*.spec.ts — Playwright e2e (auth, kanban, persistence, chat) against the running container

## Behavior

- Sign-in required (user/password); session cookie from the backend; Sign out button in the board header
- 5 fixed columns, renamable via inline input; cards add/delete; drag within/between columns
- Every board mutation PUTs the full board to `/api/board`; reload-safe persistence
- Chat sidebar keeps conversation history client-side and sends it with each message; AI board updates refresh the UI immediately

## Commands

- `npm run dev` — dev server (port 3000; no backend proxy, use for UI work only)
- `npm run build` — static export to out/
- `npm run test` — vitest unit tests
- `npm run test:e2e` — Playwright against the container at http://127.0.0.1:8000 (start it first with scripts/start.sh|bat; override with E2E_BASE_URL)
- `npm run lint` — eslint

## Conventions

- Color scheme as CSS variables in globals.css: --accent-yellow #ecad0a, --primary-blue #209dd7, --secondary-purple #753991, --navy-dark #032147, --gray-text #888888
- Test hooks: `data-testid="column-<id>"`, `card-<id>`, `chat-messages`, `user-message`, `assistant-message`
- Client components marked with "use client"; board state lives in Workspace, passed down via props
