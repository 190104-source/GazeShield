from fastapi import APIRouter, Depends
from pydantic import BaseModel
import base64, cv2, numpy as np
import face_recognition
from scipy.spatial.distance import euclidean
from uuid import UUID, uuid4

from app.db.database import get_db
from app.models.face_encoding import FaceEncoding

router = APIRouter(prefix="/vision", tags=["Vision"])

# ===== CONFIG =====
MIN_FACE_PIXELS = 100
DUPLICATE_THRESHOLD = 0.6  # increase to reduce false duplicate
FRAME_SKIP = 2  # only check duplicate every N frames

# Memory storage
last_enc = None
frame_counter = 0

class FramePayload(BaseModel):
    image: str
    user_id: str

@router.post("/register-face-frame")
def register_face_frame(payload: FramePayload, db=Depends(get_db)):
    global last_enc, frame_counter
    frame_counter += 1

    # Decode image
    try:
        header, encoded = payload.image.split(",")
        img_bytes = base64.b64decode(encoded)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    except Exception as e:
        return {"accepted": False, "reason": "Failed to decode image."}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect faces
    encs = face_recognition.face_encodings(rgb)
    face_locations = face_recognition.face_locations(rgb)

    if len(encs) != 1:
        reason = "Ensure exactly one face is visible."
        return {"accepted": False, "reason": reason, "bbox": None}

    # Check face size
    top, right, bottom, left = face_locations[0]
    if (bottom - top) < MIN_FACE_PIXELS or (right - left) < MIN_FACE_PIXELS:
        reason = "Face too small. Move closer."
        return {"accepted": False, "reason": reason, "bbox": None}

    # Normalize bounding box
    h, w, _ = frame.shape
    bbox = {
        "x": left / w,
        "y": top / h,
        "width": (right - left) / w,
        "height": (bottom - top) / h,
    }

    enc = encs[0]

    # Avoid duplicates
    if last_enc is not None and frame_counter % FRAME_SKIP == 0:
        dist = euclidean(last_enc, enc)
        if dist < DUPLICATE_THRESHOLD:
            reason = "Duplicate frame detected. Move slightly."
            return {"accepted": False, "reason": reason, "bbox": bbox}

    #  Passed all checks → save to DB
    try:
        row = FaceEncoding(user_id=payload.user_id, encoding=enc.tolist())
        db.add(row)
        db.commit()
    except Exception as e:
        return {"accepted": False, "reason": "DB error."}

    last_enc = enc
    return {"accepted": True, "bbox": bbox, "reason": "Face accepted."}

@router.post("/verify-face-login")
def verify_face_login(payload: FramePayload, db=Depends(get_db)):
    # Decode image
    try:
        header, encoded = payload.image.split(",")
        img_bytes = base64.b64decode(encoded)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    except Exception:
        return {"verified": False, "reason": "Failed to decode image."}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect face and generate encoding
    encs = face_recognition.face_encodings(rgb)

    if len(encs) != 1:
        return {"verified": False, "reason": "Ensure exactly one face is visible."}

    live_enc = encs[0]

    # Fetch stored encodings for this user
    stored_faces = db.query(FaceEncoding).filter(
        FaceEncoding.user_id == payload.user_id
    ).all()

    if not stored_faces:
        return {"verified": False, "reason": "No registered face found."}

    # Compare with all stored encodings
    for face in stored_faces:
        stored_enc = np.array(face.encoding)
        dist = euclidean(stored_enc, live_enc)

        if dist < 0.6:
            return {
                "verified": True,
                "reason": "Face verified successfully."
            }

    return {"verified": False, "reason": "Face does not match."}