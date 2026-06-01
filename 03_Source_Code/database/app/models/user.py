from sqlalchemy import ForeignKey, Integer, String, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.core.database import Base
import datetime
from app.enums.user_enums import UserRoles

class User(Base):
    """
    Base User model. 
    """

    __tablename__ = "users"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True) # ID in DB
    fullname : Mapped[str] = mapped_column(String, nullable=False) 
    idnum : Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)  # NIM / NIP
    email : Mapped[str] = mapped_column(String, unique=True, index=True,nullable=False)
    hashed_password : Mapped[str] = mapped_column(String)
    role: Mapped[UserRoles] = mapped_column(Enum(UserRoles, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    work_unit: Mapped[str | None] = mapped_column(String)
    authority_code: Mapped[str | None] = mapped_column(String)
    is_active : Mapped[bool] = mapped_column(default=True, nullable=False)

    # Timestamps
    created_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.now, nullable=False)
    updated_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True))
    last_failed_login_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True))

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"