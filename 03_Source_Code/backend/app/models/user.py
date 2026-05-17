from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
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
    idnum : Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True)  # NIM / NIP
    email : Mapped[str] = mapped_column(String, unique=True, index=True,nullable=False)
    hashed_password : Mapped[str] = mapped_column(String)
    role : Mapped[str] = mapped_column(String, nullable=False)

    # Timestamps
    created_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.now, nullable=False)
    updated_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
    
class Civitas(User):
    """
    Civitas model, inheriting from User. 
    """
    __tablename__ = "civitas"

    id : Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    
class FacilityAdmin(User):
    """
    FacilityAdmin model, inheriting from User. 
    """
    __tablename__ = "facility_admins"

    id : Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    work_unit : Mapped[str] = mapped_column(String, nullable=True)  # Unit kerja untuk facility admin
    
class SuperAdmin(User):
    """
    SuperAdmin model, inheriting from User. 
    """
    __tablename__ = "super_admins"

    id : Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), primary_key=True)
    authority_code : Mapped[str] = mapped_column(String, nullable=True)  # Kode otoritas untuk super admin
    