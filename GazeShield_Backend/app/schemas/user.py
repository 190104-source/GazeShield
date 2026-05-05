from pydantic import BaseModel, EmailStr
from uuid import UUID


# ---------- INPUT SCHEMA ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


# ---------- OUTPUT SCHEMA ----------
class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    is_owner: bool

    class Config:
        from_attributes = True
