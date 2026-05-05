from fastapi import APIRouter, WebSocket, Depends, status
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy.orm import Session
from uuid import UUID
import base64
import json

from app.core.security import get_current_user_ws
from app.db.database import get_db_ws
from app.models.session_mode import SessionMode
from app.websockets.vision_ws import vision_ws_manager

router = APIRouter()


@router.websocket("/ws/vision")
async def vision_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db_ws),
    user=Depends(get_current_user_ws),
):
    # 🔑 Get session_id
    session_id = websocket.query_params.get("session_id")

    # ❌ Missing auth or session
    if not session_id or user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ❌ Invalid UUID
    try:
        session_uuid = UUID(session_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 🔐 Validate active session
    session = (
        db.query(SessionMode)
        .filter(
            SessionMode.id == session_uuid,
            SessionMode.active == True,
        )
        .first()
    )

    if not session:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 🔐 Owner-only
    if session.owner_id != user.id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # ✅ ACCEPT CONNECTION
    await vision_ws_manager.connect(session_id, websocket)
    print(f"✅ WS connected | user={user.id} | session={session_id}")

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "FRAME":
                frame_data = data.get("frame")

                if not frame_data:
                    continue

                # -----------------------------
                # 🔍 DECODE BASE64 IMAGE
                # -----------------------------
                try:
                    header, encoded = frame_data.split(",", 1)
                    image_bytes = base64.b64decode(encoded)
                except Exception:
                    continue

                # -----------------------------
                # 🔥 FACE RECOGNITION LOGIC
                # -----------------------------
                # TODO: Replace this with your real recognition function
                # Example:
                # detected_name = recognize_face(image_bytes)
                # is_authorized = check_session_permissions(detected_name, session)

                detected_name = "Test User"  # temporary
                is_authorized = True         # temporary

                # -----------------------------
                # 📤 SEND RESULT TO FRONTEND
                # -----------------------------
                await websocket.send_json({
                    "type": "DETECTION_RESULT",
                    "detected_user": detected_name,
                    "match_status": is_authorized
                })

    except WebSocketDisconnect:
        print(f"🔌 WS disconnected | user={user.id} | session={session_id}")
    except Exception as e:
        print("❌ WS Error:", str(e))
    finally:
        vision_ws_manager.disconnect(session_id, websocket)