from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app import db

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/api/login")
def login(body: LoginRequest, request: Request) -> dict[str, str]:
    user = db.find_user(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    request.session["user"] = user["username"]
    return {"username": user["username"]}


@router.post("/api/logout")
def logout(request: Request) -> dict[str, bool]:
    request.session.clear()
    return {"ok": True}


@router.get("/api/me")
def me(request: Request) -> dict[str, str]:
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"username": user}
