from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.database import Base


class SessionViolation(Base):
    __tablename__ = "session_violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    session_id = Column(UUID(as_uuid=True), ForeignKey("session_modes.id"), nullable=False)

    violation_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)

    detected_user_id = Column(UUID(as_uuid=True), nullable=True)

    snapshot_path = Column(String, nullable=True)
    video_clip_path = Column(String, nullable=True)

    meta = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)