import json
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ValidationError

from app import db
from app.board import current_user
from app.models import BoardData

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are the AI assistant for a Kanban project management app.
The user's current board is provided below as JSON.

Board rules:
- There are exactly 5 columns. Column ids never change and columns are never added or removed; only their titles may be renamed.
- Cards have an id, title and details. New card ids must be unique short strings not already on the board.
- Moving a card means updating the cardIds arrays of the affected columns.

Respond using the required structured output:
- "reply": your message to the user.
- "board": if the user asked you to create, edit, move or delete cards, or rename columns, return the ENTIRE updated board. Otherwise return null.

Current board JSON:
"""

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


def get_api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY not configured")
    return key


def chat_completion(messages: list[dict], response_format: dict | None = None) -> dict:
    payload: dict = {"model": MODEL, "messages": messages}
    if response_format:
        payload["response_format"] = response_format
    response = httpx.post(
        OPENROUTER_URL,
        headers={"Authorization": f"Bearer {get_api_key()}"},
        json=payload,
        timeout=90,
    )
    response.raise_for_status()
    return response.json()


def build_response_format() -> dict:
    board_schema = BoardData.model_json_schema()
    defs = board_schema.pop("$defs", {})
    schema: dict = {
        "type": "object",
        "properties": {
            "reply": {"type": "string", "description": "Message to the user"},
            "board": {
                "anyOf": [board_schema, {"type": "null"}],
                "description": "The entire updated board if changes were requested, otherwise null",
            },
        },
        "required": ["reply", "board"],
        "additionalProperties": False,
    }
    if defs:
        schema["$defs"] = defs
    return {
        "type": "json_schema",
        "json_schema": {
            "name": "kanban_chat_response",
            "strict": True,
            "schema": schema,
        },
    }


@router.get("/api/ai/ping")
def ping(user: str = Depends(current_user)) -> dict[str, str]:
    result = chat_completion(
        [{"role": "user", "content": "What is 2+2? Reply with just the number."}]
    )
    return {"answer": result["choices"][0]["message"]["content"]}


@router.post("/api/chat")
def chat(body: ChatRequest, user: str = Depends(current_user)) -> dict:
    board = db.get_board(user)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + json.dumps(board)},
        *[{"role": message.role, "content": message.content} for message in body.history],
        {"role": "user", "content": body.message},
    ]
    result = chat_completion(messages, response_format=build_response_format())
    try:
        parsed = json.loads(result["choices"][0]["message"]["content"])
        reply = parsed["reply"]
        updated = parsed["board"]
        if updated is not None:
            updated = BoardData.model_validate(updated).model_dump()
    except (KeyError, TypeError, json.JSONDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=502, detail="AI returned an invalid response") from exc
    if updated is not None:
        db.save_board(user, updated)
    return {"reply": reply, "board": updated}
