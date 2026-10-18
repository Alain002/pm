import json
import os
import sqlite3
from pathlib import Path

DB_PATH = Path(
    os.environ.get(
        "DATABASE_PATH", Path(__file__).resolve().parent.parent / "data" / "app.db"
    )
)

SEED_USERNAME = "user"
SEED_PASSWORD = "password"

DEFAULT_BOARD = {
    "columns": [
        {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
        {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
        {
            "id": "col-progress",
            "title": "In Progress",
            "cardIds": ["card-4", "card-5"],
        },
        {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
        {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
    ],
    "cards": {
        "card-1": {
            "id": "card-1",
            "title": "Align roadmap themes",
            "details": "Draft quarterly themes with impact statements and metrics.",
        },
        "card-2": {
            "id": "card-2",
            "title": "Gather customer signals",
            "details": "Review support tags, sales notes, and churn feedback.",
        },
        "card-3": {
            "id": "card-3",
            "title": "Prototype analytics view",
            "details": "Sketch initial dashboard layout and key drill-downs.",
        },
        "card-4": {
            "id": "card-4",
            "title": "Refine status language",
            "details": "Standardize column labels and tone across the board.",
        },
        "card-5": {
            "id": "card-5",
            "title": "Design card layout",
            "details": "Add hierarchy and spacing for scanning dense lists.",
        },
        "card-6": {
            "id": "card-6",
            "title": "QA micro-interactions",
            "details": "Verify hover, focus, and loading states.",
        },
        "card-7": {
            "id": "card-7",
            "title": "Ship marketing page",
            "details": "Final copy approved and asset pack delivered.",
        },
        "card-8": {
            "id": "card-8",
            "title": "Close onboarding sprint",
            "details": "Document release notes and share internally.",
        },
    },
}


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.executescript(
            """
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
            """
        )
        connection.execute(
            "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)",
            (SEED_USERNAME, SEED_PASSWORD),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO boards (user_id, data)
            SELECT id, ? FROM users WHERE username = ?
            """,
            (json.dumps(DEFAULT_BOARD), SEED_USERNAME),
        )


def find_user(username: str, password: str) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT id, username FROM users WHERE username = ? AND password = ?",
            (username, password),
        ).fetchone()
    return dict(row) if row else None


def get_board(username: str) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT boards.data FROM boards
            JOIN users ON users.id = boards.user_id
            WHERE users.username = ?
            """,
            (username,),
        ).fetchone()
    return json.loads(row["data"]) if row else None


def save_board(username: str, data: dict) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            UPDATE boards SET data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = (SELECT id FROM users WHERE username = ?)
            """,
            (json.dumps(data), username),
        )
