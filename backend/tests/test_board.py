from fastapi.testclient import TestClient

from app.main import app


def login(client: TestClient) -> None:
    response = client.post(
        "/api/login", json={"username": "user", "password": "password"}
    )
    assert response.status_code == 200


def test_board_requires_auth():
    client = TestClient(app)
    assert client.get("/api/board").status_code == 401
    assert client.put("/api/board", json={}).status_code == 401


def test_get_default_board():
    client = TestClient(app)
    login(client)
    response = client.get("/api/board")
    assert response.status_code == 200
    data = response.json()
    assert len(data["columns"]) == 5
    assert "card-1" in data["cards"]


def test_put_board_roundtrip_persists():
    client = TestClient(app)
    login(client)
    board = client.get("/api/board").json()
    board["columns"][0]["title"] = "Ideas"
    response = client.put("/api/board", json=board)
    assert response.status_code == 200
    assert client.get("/api/board").json()["columns"][0]["title"] == "Ideas"


def test_put_board_rejects_invalid_payload():
    client = TestClient(app)
    login(client)
    response = client.put("/api/board", json={"columns": "nope"})
    assert response.status_code == 422


def test_login_checks_users_table():
    client = TestClient(app)
    response = client.post(
        "/api/login", json={"username": "user", "password": "password"}
    )
    assert response.status_code == 200
    response = client.post(
        "/api/login", json={"username": "ghost", "password": "password"}
    )
    assert response.status_code == 401
