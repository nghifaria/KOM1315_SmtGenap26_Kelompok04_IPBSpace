from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import mapped_column
from app.core.database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(ForeignKey("users.id"))
    refresh_token_hash = mapped_column(String, nullable=False)
    ip_address = mapped_column(String)
    user_agent = mapped_column(Text)
    is_revoked = mapped_column(Boolean, default=False)
    revoked_at = mapped_column(DateTime(timezone=True))
    created_at = mapped_column(DateTime(timezone=True))
    expires_at = mapped_column(DateTime(timezone=True))
    last_used_at = mapped_column(DateTime(timezone=True))
    deleted_at = mapped_column(DateTime(timezone=True))