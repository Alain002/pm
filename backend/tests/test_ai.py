import json

from fastapi.testclient import TestClient

from app import ai, db
from app.main import app


def login(client: TestClient) -> None:
    response = client.post(
        "/api/login", json={"username": "user", "password": "password"}
    )
    assert response.status_code == 200


def test_ping_requires_auth():
    client = TestClient(app)
    assert client.get("/api/ai/ping").status_code == 401


def test_ping_without_key_returns_503(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    client = TestClient(app)
    login(client)
    assert client.get("/api/ai/ping").status_code == 503


def test_ping_returns_answer(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"choices": [{"message": {"content": "4"}}]}

    def fake_post(url, headers, json, timeout):
        captured["url"] = url
        captured["headers"] = headers
        captured["payload"] = json
        return FakeResponse()

    monkeypatch.setattr(ai.httpx, "post", fake_post)
    client = TestClient(app)
    login(client)
    response = client.get("/api/ai/ping")
    assert response.status_code == 200
    assert response.json() == {"answer": "4"}
    assert captured["url"] == ai.OPENROUTER_URL
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["payload"]["model"] == ai.MODEL


def fake_completion(content: dict, captured: dict):
    def run(messages, response_format=None):
        captured["messages"] = messages
        captured["response_format"] = response_format
        return {"choices": [{"message": {"content": json.dumps(content)}}]}

    return run


def test_chat_requires_auth():
    client = TestClient(app)
    assert client.post("/api/chat", json={"message": "hi"}).status_code == 401


def test_chat_reply_only(monkeypatch):
    captured = {}
    monkeypatch.setattr(
        ai, "chat_completion", fake_completion({"reply": "All good!", "board": None}, captured)
    )
    client = TestClient(app)
    login(client)
    before = client.get("/api/board").json()

    response = client.post(
        "/api/chat",
        json={
            "message": "How is my board looking?",
            "history": [{"role": "user", "content": "earlier"}],
        },
    )
    assert response.status_code == 200
    assert response.json() == {"reply": "All good!", "board": None}
    assert client.get("/api/board").json() == before

    messages = captured["messages"]
    assert messages[0]["role"] == "system"
    assert '"col-backlog"' in messages[0]["content"]
    assert messages[1] == {"role": "user", "content": "earlier"}
    assert messages[-1] == {"role": "user", "content": "How is my board looking?"}
    assert captured["response_format"]["type"] == "json_schema"


def test_chat_updates_board(monkeypatch):
    board = json.loads(json.dumps(db.DEFAULT_BOARD))
    board["columns"][0]["title"] = "Ideas"
    monkeypatch.setattr(
        ai, "chat_completion", fake_completion({"reply": "Renamed!", "board": board}, {})
    )
    client = TestClient(app)
    login(client)

    response = client.post("/api/chat", json={"message": "Rename Backlog to Ideas"})
    assert response.status_code == 200
    assert response.json()["board"]["columns"][0]["title"] == "Ideas"
    assert client.get("/api/board").json()["columns"][0]["title"] == "Ideas"

    # restore defaults for other tests
    client.put("/api/board", json=db.DEFAULT_BOARD)


def test_chat_invalid_ai_response(monkeypatch):
    monkeypatch.setattr(
        ai,
        "chat_completion",
        lambda messages, response_format=None: {
            "choices": [{"message": {"content": "not json"}}]
        },
    )
    client = TestClient(app)
    login(client)
    response = client.post("/api/chat", json={"message": "hi"})
    assert response.status_code == 502
