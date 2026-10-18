from fastapi.testclient import TestClient

from app.main import app


def test_login_success():
    client = TestClient(app)
    response = client.post(
        "/api/login", json={"username": "user", "password": "password"}
    )
    assert response.status_code == 200
    assert response.json() == {"username": "user"}


def test_login_invalid_credentials():
    client = TestClient(app)
    response = client.post(
        "/api/login", json={"username": "user", "password": "nope"}
    )
    assert response.status_code == 401


def test_me_requires_auth():
    client = TestClient(app)
    assert client.get("/api/me").status_code == 401


def test_me_after_login_and_logout():
    client = TestClient(app)
    client.post("/api/login", json={"username": "user", "password": "password"})
    assert client.get("/api/me").json() == {"username": "user"}
    client.post("/api/logout")
    assert client.get("/api/me").status_code == 401
