from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
from datetime import datetime
import uuid

class Violation(Base):
    __tablename__ = "violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    session_id = Column(String, nullable=False)

    reason = Column(String, nullable=False)
    snapshot_path = Column(String, nullable=False)
    video_path = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
