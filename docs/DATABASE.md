# Database

SQLite via Python stdlib `sqlite3`. File location: `DATABASE_PATH` env, default `backend/data/app.db` (`/app/data/app.db` in the container). The database and seed data are created automatically on startup if missing.

## Schema

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Design decisions

- **Board as JSON blob**: `boards.data` holds the full board state as JSON, exactly matching the frontend `BoardData` shape (`{columns: [{id, title, cardIds}], cards: {id: {id, title, details}}}`). The frontend owns the shape; Pydantic models validate it on write. This keeps reads/writes trivial and matches the one-board-per-user MVP.
- **users table now**: although the MVP has a single hardcoded sign-in (`user` / `password`), credentials live in the `users` table (seeded at startup) so multiple users work without a schema change. Passwords are plaintext for the MVP only — hashing is a post-MVP concern.
- **One board per user**: `boards.user_id` is the primary key; the board is seeded from the default five-column layout on first run.
