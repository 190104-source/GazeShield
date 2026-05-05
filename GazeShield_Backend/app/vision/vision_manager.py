from typing import Optional
import threading

from sqlalchemy import UUID

from app.vision.gaze_monitor import GazeMonitor
from app.websockets.vision_ws import vision_ws_manager
from app.services.violation_handler import handle_violation



class VisionManager:
    """
    Singleton controller for vision runtime.

    Responsibilities:
    - Own exactly ONE GazeMonitor instance
    - Enforce ONE active session at a time
    - Route frames → gaze monitor
    - Route violations → WebSocket (session-scoped)
    """

    def __init__(self):
        self._monitor: Optional[GazeMonitor] = None
        self._session_id: Optional[str] = None
        self._lock = threading.Lock()

    # --------------------------------------------------
    # STATE
    # --------------------------------------------------

    def is_running(self) -> bool:
        return self._monitor is not None

    def current_session_id(self) -> Optional[str]:
        return self._session_id

    # --------------------------------------------------
    # START
    # --------------------------------------------------

    def start(
        self,
        *,
        session_id: str,
        mode: str,
        owner_user_id: UUID,
        allowed_user_ids: list,
        allowed_encodings: list,
    ):
        """
        Start vision monitoring for ONE session.

        Called ONCE via /vision/start
        """

        with self._lock:
            # 🔒 Safety: stop any previous session
            self.stop()

            self._session_id = session_id

            self._monitor = GazeMonitor(
                allowed_encodings=allowed_encodings,
                allowed_user_ids=allowed_user_ids,
                owner_user_id=owner_user_id,
                mode=mode,
                session_id=session_id,
                violation_callback=self._on_violation,
            )

            print(
                f"🎥 Vision started | session={session_id} | mode={mode}"
            )

    # --------------------------------------------------
    # FRAME PROCESSING
    # --------------------------------------------------

    def process_frame(self, *, session_id: str, frame):
        """
        Process ONE frame from frontend.

        Frontend MUST send session_id with every frame.
        """

        if not self._monitor:
            return

        # 🔐 HARD SESSION ISOLATION
        if session_id != self._session_id:
            return

        # Sequential processing (timing matters)
        self._monitor.process_frame(frame)

    # --------------------------------------------------
    # VIOLATION PIPELINE
    # --------------------------------------------------

    def _on_violation(self, payload: dict):
        """Central violation dispatcher.
        Delegates to violation_handler."""
        handle_violation(payload)


    # --------------------------------------------------
    # STOP
    # --------------------------------------------------

    def stop(self):
        """
        Stop vision monitoring and clear session state.
        """

        with self._lock:
            if self._monitor:
                print(f"🛑 Vision stopped | session={self._session_id}")

            self._monitor = None
            self._session_id = None


#  GLOBAL SINGLETON INSTANCE
vision_manager = VisionManager()
