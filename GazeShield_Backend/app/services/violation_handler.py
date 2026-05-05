from app.models.session_violation import SessionViolation
from app.websockets.vision_ws import vision_ws_manager
from app.db.database import SessionLocal
import asyncio


def handle_violation(payload: dict):
    db = SessionLocal()
    try:
        violation = SessionViolation(
            session_id=payload["session_id"],
            violation_type=payload["reason"],
            detected_user_id=payload.get("detected_user_id"),
            snapshot_path=payload.get("snapshot"),
            video_clip_path=payload.get("video"),
            meta=payload.get("meta"),
        )

        db.add(violation)
        db.commit()

        # 🔔 SESSION-SCOPED WS ALERT
        asyncio.create_task(
            vision_ws_manager.broadcast_to_session(
                payload["session_id"],
                {
                    "type": "VIOLATION",
                    "reason": payload["reason"],
                    "snapshot": payload["snapshot"],
                    "timestamp": payload["timestamp"],
                    "blur": True,   # 🔥 frontend contract
                }
            )
        )

    finally:
        db.close()
