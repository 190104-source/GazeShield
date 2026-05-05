from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import threading

from app.db.database import get_db
from app.models.session_mode import SessionMode
from app.models.session_member import SessionMember
from app.models.team import Team
from app.models.user import User
from app.schemas.session import SessionStart, SessionResponse
from app.core.security import get_current_user
from app.services.session_authorization import get_allowed_user_ids
from app.vision.vision_manager import vision_manager
from app.websockets.vision_ws import vision_ws_manager
from fastapi import BackgroundTasks

router = APIRouter(prefix="/session", tags=["Session Modes"])

VALID_MODES = {"single", "team", "member", "exam"}


# --------------------------------------------------
# START SESSION
# --------------------------------------------------
@router.post("/start")
def start_session(
    data: SessionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 0️ Validate mode
    if data.mode_type not in VALID_MODES:
        raise HTTPException(status_code=400, detail="Invalid mode_type")

    # 1️ Stop existing active session (DB only)
    existing = (
        db.query(SessionMode)
        .filter(
            SessionMode.owner_id == current_user.id,
            SessionMode.active == True,
        )
        .first()
    )

    if existing:
        existing.active = False
        existing.ended_at = datetime.utcnow()

    # 2️ TEAM MODE
    if data.mode_type == "team":
        if not data.team_id:
            raise HTTPException(
                status_code=400,
                detail="team_id is required for team mode",
            )

        team = db.query(Team).filter(Team.id == data.team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
    else:
        data.team_id = None

    # 3️ MEMBER MODE
    selected_users: List[User] = []

    if data.mode_type == "member":
        if not data.selected_members:
            raise HTTPException(
                status_code=400,
                detail="selected_members required for member mode",
            )

        emails = [m.email for m in data.selected_members]

        selected_users = (
            db.query(User)
            .filter(User.email.in_(emails))
            .all()
        )

        if len(selected_users) != len(emails):
            raise HTTPException(
                status_code=400,
                detail="One or more users not found",
            )

    # 4️ Create session
    session = SessionMode(
        owner_id=current_user.id,
        mode_type=data.mode_type,
        team_id=data.team_id,
        active=True,
        started_at=datetime.utcnow(),
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    # 5️ Insert session members
    if data.mode_type == "member":
        for user in selected_users:
            db.add(
                SessionMember(
                    session_id=session.id,
                    user_id=user.id,
                )
            )
        db.commit()

    # 6️ Resolve allowed users
    allowed_user_ids = get_allowed_user_ids(db, session)

    # 7️ START VISION (BACKGROUND THREAD)
    threading.Thread(
        target=vision_manager.start,
        kwargs={
            "session_id": str(session.id),
            "mode": session.mode_type,
            "owner_user_id": current_user.id,
            "allowed_user_ids": allowed_user_ids,
            "allowed_encodings": None,
        },
        daemon=True,
    ).start()

    # 8️ SAFE RESPONSE (JSON ONLY)
    return {
        "session_id": str(session.id),
        "mode_type": session.mode_type,
        "team_id": str(session.team_id) if session.team_id else None,
        "allowed_user_ids": [str(uid) for uid in allowed_user_ids],
        "started_at": session.started_at.isoformat(),
    }


# --------------------------------------------------
# STOP SESSION
# --------------------------------------------------
@router.post("/stop")
def stop_session(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(SessionMode)
        .filter(
            SessionMode.owner_id == current_user.id,
            SessionMode.active == True,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="No active session")

    session.active = False
    session.ended_at = datetime.utcnow()
    db.commit()

    #  Stop vision runtime safely
    background_tasks.add_task(vision_manager.stop)

    #  Close all WS connections for this session
    background_tasks.add_task(
        vision_ws_manager.close_session,
        str(session.id),
    )

    return {"message": "Session stopped"}



# --------------------------------------------------
# CURRENT SESSION
# --------------------------------------------------
@router.get("/current", response_model=SessionResponse)
def get_current_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(SessionMode)
        .filter(
            SessionMode.owner_id == current_user.id,
            SessionMode.active == True,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="No active session")

    allowed_user_ids = get_allowed_user_ids(db, session)

    return SessionResponse(
        session_id=session.id,
        mode_type=session.mode_type,
        team_id=session.team_id,
        allowed_user_ids=allowed_user_ids,
        started_at=session.started_at,
    )


# --------------------------------------------------
# ALLOWED USERS
# --------------------------------------------------
@router.get("/allowed-users")
def allowed_users_for_current_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(SessionMode)
        .filter(
            SessionMode.owner_id == current_user.id,
            SessionMode.active == True,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found",
        )

    allowed_user_ids = get_allowed_user_ids(db, session)

    return {
        "session_id": str(session.id),
        "mode_type": session.mode_type,
        "team_id": str(session.team_id) if session.team_id else None,
        "allowed_user_ids": [str(uid) for uid in allowed_user_ids],
    }
