from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.schemas.team import TeamCreate, TeamResponse, MyTeamResponse
from app.schemas.team_member import TeamInviteRequest, TeamMemberListResponse
from app.dependencies import get_current_user, require_team_owner



router = APIRouter(prefix="/teams", tags=["Teams"])


# ---------------------------------------------------------
# CREATE TEAM (Owner only, creates self as owner member)
# ---------------------------------------------------------
# ---------------------------------------------------------
# CREATE TEAM (Owner = Logged-in user)
# ---------------------------------------------------------
@router.post(
    "/create",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED
)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # current_user comes from JWT
    team = Team(
        team_name=team_data.team_name,
        owner_id=current_user.id
    )

    owner_membership = TeamMember(
        user_id=current_user.id,
        team=team,
        role="owner",
        joined_at=datetime.utcnow()
    )

    db.add(team)
    db.add(owner_membership)
    db.commit()
    db.refresh(team)

    return team


# ---------------------------------------------------------
# GET MY TEAMS (Owner + Member)
# ---------------------------------------------------------
@router.get(
    "/my-teams",
    response_model=list[MyTeamResponse]
)
def get_my_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    teams = (
        db.query(
            Team.id.label("team_id"),
            Team.team_name,
            TeamMember.role,
            TeamMember.joined_at
        )
        .join(TeamMember, Team.id == TeamMember.team_id)
        .filter(TeamMember.user_id == current_user.id)
        .all()
    )
    return teams


# ---------------------------------------------------------
# INVITE TEAM MEMBER (Invite by EMAIL)
# ---------------------------------------------------------
@router.post(
    "/{team_id}/invite",
    response_model=TeamMemberListResponse,
    status_code=status.HTTP_201_CREATED
)
def invite_team_member(
    team_id: UUID,
    payload: TeamInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #  Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    #  Only OWNER can invite
    require_team_owner(team_id, current_user.id, db)

    #  Find user by EMAIL
    invited_user = db.query(User).filter(User.email == payload.email).first()
    if not invited_user:
        raise HTTPException(
            status_code=404,
            detail="User with this email does not exist"
        )

    #  Prevent duplicate membership
    existing = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == invited_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User is already a team member"
        )

    # 5️⃣ Add member
    team_member = TeamMember(
        user_id=invited_user.id,
        team_id=team_id,
        role="member",
        joined_at=datetime.utcnow()
    )

    db.add(team_member)
    db.commit()

    # 6️⃣ RETURN JOINED RESPONSE (IMPORTANT FIX ✅)
    member_response = (
        db.query(
            TeamMember.user_id,
            User.email,
            TeamMember.role,
            TeamMember.joined_at
        )
        .join(User, User.id == TeamMember.user_id)
        .filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == invited_user.id
        )
        .first()
    )

    return member_response

# ---------------------------------------------------------
# LEAVE TEAM (Member only)
# ---------------------------------------------------------
@router.delete(
    "/{team_id}/leave",
    status_code=status.HTTP_204_NO_CONTENT
)
def leave_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="You are not a member of this team"
        )

    if membership.role == "owner":
        raise HTTPException(
            status_code=403,
            detail="Owner cannot leave the team"
        )

    db.delete(membership)
    db.commit()

    return


# ---------------------------------------------------------
# REMOVE TEAM MEMBER (Owner only)
# ---------------------------------------------------------
@router.delete(
    "/{team_id}/remove/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_team_owner(team_id, current_user.id, db)

    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="User is not a member of this team"
        )

    if membership.role == "owner":
        raise HTTPException(
            status_code=403,
            detail="Owner cannot be removed"
        )

    db.delete(membership)
    db.commit()

    return


# ---------------------------------------------------------
# DELETE TEAM (Owner only)
# ---------------------------------------------------------
@router.delete(
    "/{team_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_team_owner(team_id, current_user.id, db)

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # delete all memberships first
    db.query(TeamMember).filter(
        TeamMember.team_id == team_id
    ).delete()

    db.delete(team)
    db.commit()

    return

@router.get(
    "/{team_id}/members",
    response_model=list[TeamMemberListResponse]
)
def get_team_members(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1️⃣ Check team exists
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # 2️⃣ Ensure current user is a MEMBER of this team
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id
    ).first()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # 3️⃣ Fetch all members + user email
    members = (
        db.query(
            TeamMember.user_id,
            User.email,
            TeamMember.role,
            TeamMember.joined_at
        )
        .join(User, User.id == TeamMember.user_id)
        .filter(TeamMember.team_id == team_id)
        .all()
    )

    return members