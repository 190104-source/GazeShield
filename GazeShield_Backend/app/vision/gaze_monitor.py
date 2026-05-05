import cv2
import face_recognition
import numpy as np
import dlib
import time
import os
from datetime import datetime
from collections import deque
import traceback

PROCESS_EVERY_N_FRAMES = 3
ALERT_FACE_MIN = 40
ALERT_COOLDOWN = 5.0

VIDEO_CLIP_SECONDS = 6
VIDEO_FPS = 20

MAX_YAW_DEG = 30
PITCH_RANGE = (140, 190)
GAZE_DEVIATION_THRESH = 1.0

PREDICTOR_PATH = "shape_predictor_68_face_landmarks.dat"


class GazeMonitor:
    def __init__(
        self,
        *,
        allowed_encodings: dict,   # user_id -> encoding
        allowed_user_ids: list,
        owner_user_id,
        mode: str,
        session_id: str,
        violation_callback,
        save_root="media/sessions",
        debug=True,
    ):
        self.allowed_encodings = allowed_encodings
        self.allowed_user_ids = set(allowed_user_ids)
        self.owner_user_id = owner_user_id
        self.mode = mode
        self.session_id = session_id
        self.violation_callback = violation_callback
        self.debug = debug

        self.predictor = dlib.shape_predictor(PREDICTOR_PATH)

        self.frame_count = 0
        self.last_alert_time = 0.0
        self.recent_frames = deque(maxlen=VIDEO_CLIP_SECONDS * VIDEO_FPS)

        self.last_boxes = []
        self.last_user_ids = []

        # 📁 session-scoped storage
        self.session_dir = os.path.join(save_root, session_id)
        os.makedirs(self.session_dir, exist_ok=True)

    def dbg(self, *a):
        if self.debug:
            print("[GAZE]", *a)

    # ---------------- AUTH ----------------

    def classify_user(self, user_id):
        if user_id == self.owner_user_id:
            return "OWNER"
        if user_id in self.allowed_user_ids:
            return "AUTHORIZED"
        return "UNAUTHORIZED"

    # ---------------- POSE ----------------

    def estimate_head_pose(self, shape, frame_shape):
        try:
            image_points = np.array([
                (shape.part(30).x, shape.part(30).y),
                (shape.part(8).x, shape.part(8).y),
                (shape.part(36).x, shape.part(36).y),
                (shape.part(45).x, shape.part(45).y),
                (shape.part(48).x, shape.part(48).y),
                (shape.part(54).x, shape.part(54).y),
            ], dtype="double")

            model_points = np.array([
                (0, 0, 0),
                (0, -330, -65),
                (-225, 170, -135),
                (225, 170, -135),
                (-150, -150, -125),
                (150, -150, -125),
            ])

            h, w = frame_shape[:2]
            cam = np.array([[w, 0, w/2], [0, w, h/2], [0, 0, 1]], dtype="double")

            ok, rv, tv = cv2.solvePnP(model_points, image_points, cam, np.zeros((4,1)))
            if not ok:
                return None, None

            rmat, _ = cv2.Rodrigues(rv)
            proj = np.hstack((rmat, tv))
            _, _, _, _, _, _, euler = cv2.decomposeProjectionMatrix(proj)
            return float(euler[1]), float(euler[0])
        except Exception:
            return None, None

    def is_looking(self, yaw, pitch, shape):
        if yaw is None or pitch is None:
            return False

        if abs(yaw) > MAX_YAW_DEG:
            return False

        if not (PITCH_RANGE[0] <= pitch <= PITCH_RANGE[1]):
            return False

        left = np.array([(shape.part(i).x, shape.part(i).y) for i in range(36, 42)])
        right = np.array([(shape.part(i).x, shape.part(i).y) for i in range(42, 48)])
        gaze_vec = right.mean(axis=0) - left.mean(axis=0)
        ratio = abs(gaze_vec[0]) / max(1, abs(gaze_vec[0]) + abs(gaze_vec[1]))
        return ratio < GAZE_DEVIATION_THRESH

    # ---------------- CORE ----------------

    def process_frame(self, frame):
        self.frame_count += 1
        self.recent_frames.append(frame.copy())

        if self.frame_count % PROCESS_EVERY_N_FRAMES != 0:
            return

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        boxes = face_recognition.face_locations(rgb, model="hog")
        encs = face_recognition.face_encodings(rgb, boxes)

        detected_users = []

        for enc in encs:
            matched_id = None
            for uid, ref_enc in self.allowed_encodings.items():
                if face_recognition.compare_faces([ref_enc], enc, tolerance=0.45)[0]:
                    matched_id = uid
                    break
            detected_users.append(matched_id)

        # ---- MODE RULES ----
        if self.mode in ("single", "exam") and len(detected_users) != 1:
            self._violate(frame, "MULTIPLE_FACES")
            return

        for box, user_id in zip(boxes, detected_users):
            t, r, b, l = box
            if b - t < ALERT_FACE_MIN:
                continue

            rect = dlib.rectangle(l, t, r, b)
            shape = self.predictor(gray, rect)
            yaw, pitch = self.estimate_head_pose(shape, frame.shape)
            looking = self.is_looking(yaw, pitch, shape)

            role = self.classify_user(user_id)

            # 🚨 UNAUTHORIZED FACE
            if role == "UNAUTHORIZED":
                self._violate(frame, "UNAUTHORIZED_FACE")
                return

            # 🚨 EXAM OWNER LOOKING AWAY
            if self.mode == "exam" and role == "OWNER" and not looking:
                self._violate(frame, "GAZE_DEVIATION")
                return

    # ---------------- ALERT ----------------

    def _violate(self, frame, reason):
        now = time.time()
        if now - self.last_alert_time < ALERT_COOLDOWN:
            return

        self.last_alert_time = now
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        img = f"{self.session_dir}/snap_{ts}.jpg"
        vid = f"{self.session_dir}/clip_{ts}.avi"

        cv2.imwrite(img, frame)

        out = cv2.VideoWriter(
            vid,
            cv2.VideoWriter_fourcc(*"XVID"),
            VIDEO_FPS,
            (frame.shape[1], frame.shape[0]),
        )
        for f in self.recent_frames:
            out.write(f)
        out.release()

        payload = {
            "session_id": self.session_id,
            "type": "VIOLATION",
            "reason": reason,
            "snapshot_url": f"/media/sessions/{self.session_id}/{os.path.basename(img)}",
            "video_url": f"/media/sessions/{self.session_id}/{os.path.basename(vid)}",
            "timestamp": datetime.utcnow().isoformat(),
        }

        self.violation_callback(payload)
