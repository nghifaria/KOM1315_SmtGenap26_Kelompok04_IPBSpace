from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id : Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    session_token : Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    refresh_token : Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    created_at : Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    expires_at : Mapped[DateTime] = mapped_column(DateTime, nullable=False)

   