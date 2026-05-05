from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from pydantic import EmailStr


class TeamInviteRequest(BaseModel):
    email: EmailStr


class TeamMemberListResponse(BaseModel):
    user_id: UUID
    email: EmailStr
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True