import cv2
import face_recognition
import numpy as np
import time
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.face_encoding import FaceEncoding
from app.models.user import User

TARGET_SAMPLES = 50

def register_face_realtime(db: Session, user_id: UUID):

    # ✅ Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    cap = cv2.VideoCapture(0)
    collected = 0

    print("[INFO] Look at the camera. Capturing face samples...")

    while collected < TARGET_SAMPLES:
        ret, frame = cap.read()
        if not ret:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        boxes = face_recognition.face_locations(rgb, model="hog")
        encodings = face_recognition.face_encodings(rgb, boxes)

        if encodings:
            for enc in encodings:
                face_row = FaceEncoding(
                    user_id=user_id,
                    encoding=enc.tobytes()  # ✅ FIXED
                )
                db.add(face_row)
                collected += 1
                print(f"[INFO] Captured {collected}/{TARGET_SAMPLES}")

                if collected >= TARGET_SAMPLES:
                    break

        cv2.imshow("Registering Face", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        time.sleep(0.05)

    cap.release()
    cv2.destroyAllWindows()
    db.commit()

    print(f"[DONE] Registered {collected} samples for user {user_id}")
