from pydantic import BaseModel
from uuid import UUID

class FaceRegisterRequest(BaseModel):
    user_id: UUID
