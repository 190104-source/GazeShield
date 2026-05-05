from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List


# 🔹 Used only for MEMBER mode
class SelectedMember(BaseModel):
    email: EmailStr


class SessionStart(BaseModel):
    mode_type: str = Field(
        ...,
        description="single | team | member | exam"
    )

    team_id: Optional[UUID] = Field(
        None,
        description="Required only when mode_type = team"
    )

    selected_members: Optional[List[SelectedMember]] = Field(
        None,
        description="Required only when mode_type = member"
    )

class SessionResponse(BaseModel):
    session_id: UUID
    mode_type: str
    team_id: Optional[UUID] = None
    allowed_user_ids: List[UUID]
    started_at: datetime

    class Config:
        from_attributes = True