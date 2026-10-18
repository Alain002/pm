from fastapi import APIRouter, Depends, HTTPException, Request

from app import db
from app.models import BoardData

router = APIRouter()


def current_user(request: Request) -> str:
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.get("/api/board")
def read_board(user: str = Depends(current_user)) -> dict:
    board = db.get_board(user)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.put("/api/board")
def update_board(board: BoardData, user: str = Depends(current_user)) -> dict:
    db.save_board(user, board.model_dump())
    return board.model_dump()
