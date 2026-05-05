from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import base64
import cv2
import numpy as np

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.face_encoding import FaceEncoding
from app.models.session_mode import SessionMode
from app.services.session_authorization import get_allowed_user_ids
from app.vision.vision_manager import vision_manager
from app.models.session_violation import SessionViolation


router = APIRouter(prefix="/vision", tags=["Vision Runtime"])


# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------

class VisionFramePayload(BaseModel):
    session_id: str
    image: str  # base64 image


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def decode_base64_image(image: str) -> np.ndarray:
    try:
        header, encoded = image.split(",")
        img_bytes = base64.b64decode(encoded)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Frame decode failed")
        return frame
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image"
        )


# --------------------------------------------------
# ROUTES
# --------------------------------------------------

@router.post("/start")
def start_vision(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initialize vision monitoring for the ACTIVE session.
    """

    # 1️⃣ Fetch active session
    session = db.query(SessionMode).filter(
        SessionMode.owner_id == current_user.id,
        SessionMode.active == True
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="No active session found"
        )

    # 2️⃣ Resolve authorized users
    allowed_user_ids = get_allowed_user_ids(db, session)

    # 3️⃣ Load face encodings
    rows = db.query(FaceEncoding).filter(
        FaceEncoding.user_id.in_(allowed_user_ids)
    ).all()

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="No face encodings found for allowed users"
        )

    allowed_encodings = [np.array(r.encoding) for r in rows]

    # 4️⃣ Start vision runtime
    vision_manager.start(
        session_id=str(session.id),
        mode=session.mode_type,
        owner_user_id=str(session.owner_id),
        allowed_user_ids=[str(uid) for uid in allowed_user_ids],
        allowed_encodings=allowed_encodings,
    )

    return {
        "message": "Vision monitoring started",
        "session_id": str(session.id),
        "mode": session.mode_type,
    }


@router.post("/frame")
def process_frame(
    payload: VisionFramePayload,
    current_user: User = Depends(get_current_user),
):
    """
    Receive one frame from frontend.
    """

    if not vision_manager.is_running():
        raise HTTPException(
            status_code=400,
            detail="Vision monitoring not started"
        )

    frame = decode_base64_image(payload.image)

    vision_manager.process_frame(
        session_id=payload.session_id,
        frame=frame
    )

    return {"status": "ok"}


@router.post("/stop")
def stop_vision(
    current_user: User = Depends(get_current_user),
):
    if not vision_manager.is_running():
        return {"message": "Vision already stopped"}

    vision_manager.stop()
    return {"message": "Vision monitoring stopped"}



@router.get("/violations/{session_id}")
def get_session_violations(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch all violations for a given session.
    """

    violations = (
        db.query(SessionViolation)
        .filter(SessionViolation.session_id == session_id)
        .order_by(SessionViolation.created_at.desc())
        .all()
    )

    return {
        "session_id": session_id,
        "count": len(violations),
        "violations": [
            {
                "id": str(v.id),
                "type": v.violation_type,
                "snapshot": v.snapshot_path,
                "video": v.video_clip_path,
                "confidence": v.confidence,
                "detected_user_id": str(v.detected_user_id) if v.detected_user_id else None,
                "meta": v.meta,
                "timestamp": v.created_at.isoformat(),
            }
            for v in violations
        ]
    }
