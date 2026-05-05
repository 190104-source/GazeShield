from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_owner = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    #  Remove this direct team_id if using many-to-many via TeamMember
    # team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)

    # Relationships
    owned_teams = relationship("Team", back_populates="owner", foreign_keys="Team.owner_id")
    teams = relationship(
        "Team",
        secondary="team_members",
        back_populates="users"
    )
    
    face_encodings = relationship(
    "FaceEncoding",
    back_populates="user",
    cascade="all, delete-orphan"
)

