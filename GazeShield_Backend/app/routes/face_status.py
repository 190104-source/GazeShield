# app/routes/face_status.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.models.face_encoding import FaceEncoding

router = APIRouter(prefix="/users", tags=["Users"])

REQUIRED_FACE_COUNT = 50

@router.get("/{user_id}/face-status")
def face_status(user_id: UUID, db: Session = Depends(get_db)):
    count = (
        db.query(FaceEncoding)
        .filter(FaceEncoding.user_id == user_id)
        .count()
    )

    return {
        "registered": count >= REQUIRED_FACE_COUNT,
        "count": count
    }
