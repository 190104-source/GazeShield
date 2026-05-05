from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.face_encoding import FaceEncoding
from app.models.user import User
import os
from datetime import datetime
import base64

router = APIRouter(prefix="/faces", tags=["Faces"])

# 🔹 Existing GET endpoint to fetch face descriptors
@router.get("/")
def get_faces(ids: str = Query(...), db: Session = Depends(get_db)):
    id_list = ids.split(",")

    encodings = (
        db.query(FaceEncoding)
        .join(User, FaceEncoding.user_id == User.id)
        .filter(FaceEncoding.user_id.in_(id_list))
        .all()
    )

    response = {}

    for face in encodings:
        if face.user.name not in response:
            response[face.user.name] = []
        response[face.user.name].append(face.encoding)

    return [
        {"name": name, "descriptors": descriptors}
        for name, descriptors in response.items()
    ]

# 🔹 NEW: Evidence endpoint to save unknown faces
EVIDENCE_DIR = "./evidence"
os.makedirs(EVIDENCE_DIR, exist_ok=True)

@router.post("/evidence")
async def save_evidence(data: dict):
    """
    Save unknown face images sent from frontend as base64
    """
    try:
        # Get base64 string
        image_data = data["image"].split(",")[1] if "," in data["image"] else data["image"]
        image_bytes = base64.b64decode(image_data)

        # Create timestamped filename
        filename = f"evidence_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(EVIDENCE_DIR, filename)

        # Write to file
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return {"status": "ok", "filename": filename}
    except Exception as e:
        return {"status": "error", "message": str(e)}