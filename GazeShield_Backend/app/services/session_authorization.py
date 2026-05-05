from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.models.user import User
from app.models.team_member import TeamMember
from app.models.session_mode import SessionMode
from app.models.session_member import SessionMember
from typing import Set


def get_allowed_user_ids(
    db: Session,
    session: SessionMode
) -> List[UUID]:
    """
    Returns a list of user IDs who are AUTHORIZED
    to view the screen for the given session.
    """

    # 🔐 SINGLE & EXAM → owner only
    if session.mode_type in ["single", "exam"]:
        return [session.owner_id]

    # 👥 MEMBER → selected users only
    if session.mode_type == "member":
        selected = db.query(SessionMember.user_id).filter(
            SessionMember.session_id == session.id
        ).all()

        selected_ids = [u.user_id for u in selected]

        # Safety: owner always included
        return list(set([session.owner_id] + selected_ids))

    # 👥 TEAM → owner + team members
    if session.mode_type == "team":
        if not session.team_id:
            return [session.owner_id]  # safety fallback

        members = db.query(TeamMember.user_id).filter(
            TeamMember.team_id == session.team_id
        ).all()

        member_ids = [m for (m,) in members]

        # Ensure owner always included
        return list(set([session.owner_id] + member_ids))

    # ❌ Safety fallback
    return []