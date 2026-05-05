from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class TeamCreate(BaseModel):
    team_name: str = Field(..., alias="name")

    class Config:
        populate_by_name = True


class TeamResponse(BaseModel):
    id: UUID
    team_name: str
    owner_id: UUID

    class Config:
        orm_mode = True
class MyTeamResponse(BaseModel):
    team_id: UUID
    team_name: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True