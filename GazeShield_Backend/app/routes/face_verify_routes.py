from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.services.face_service import verify_user_face


router = APIRouter(
    prefix="/face",
    tags=["Face Verification"]
)


@router.post("/verify")
def verify_face(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Verify logged-in user's face using base64 image input.
    """

    # ----------------------------
    # 1. Extract image from request
    # ----------------------------
    image_base64 = payload.get("image")

    if not image_base64:
        raise HTTPException(
            status_code=400,
            detail="Image field is required"
        )

    # ----------------------------
    # 2. Call face verification service
    # ----------------------------
    success, message = verify_user_face(
        db=db,
        user_id=current_user.id,
        image_base64=image_base64
    )

    # ----------------------------
    # 3. Return response
    # ----------------------------
    return {
        "verified": success,
        "message": message
    }