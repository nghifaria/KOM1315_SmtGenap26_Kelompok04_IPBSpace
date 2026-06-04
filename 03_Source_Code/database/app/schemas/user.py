import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from app.enums.user_enums import UserRoles

class UserBase(BaseModel):
    """Base model for user-related operations, containing common fields and validation logic."""
    email: EmailStr
    fullname: str = Field(..., min_length=3)
    idnum: str
    role: UserRoles = Field(default=UserRoles.CIVITAS)
    is_active: bool = Field(default=True)

    @field_validator("fullname")
    def validate_fullname(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Full name cannot be empty or just whitespace")
        return value

    @field_validator("role")
    def validate_role(cls, value: UserRoles) -> UserRoles:
        return value

class UserCreate(UserBase):
    """Model for creating a new user, extending UserBase with password field and additional validation."""
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        """
        Docstring for validate_password
        
        :param cls: UserCreate class reference
        :type cls: Type[UserCreate]
        :param value: The password string to validate
        :type value: str
        :return: the validated password string if it meets the criteria
        :rtype: str
        """
        if not value.strip():
            raise ValueError("Password cannot be empty or just whitespace")
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if value.isdigit() or value.isalpha():
            raise ValueError("Password must contain both letters and numbers")
        if any(char.isspace() for char in value):
            raise ValueError("Password cannot contain whitespace characters")
        return value
    
class UserLogin(BaseModel):
    """Model for user login, containing email and password fields."""
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """Model for user response, extending UserBase with additional fields for user information."""
    id: int
    created_at: Optional[datetime.datetime] = None
    updated_at: Optional[datetime.datetime] = None
    last_login: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserInDB(UserResponse):
    """Model for user data stored in the database, extending UserResponse with hashed password field."""
    hashed_password: str

class UserUpdate(BaseModel):
    fullname: str = Field(..., min_length=3)
    idnum: str
    email: EmailStr

class ManagerCreate(UserCreate):
    role: UserRoles = Field(default=UserRoles.FACILITY_MANAGER)
    work_unit: Optional[str] = None

class ManagerUpdate(BaseModel):
    fullname: Optional[str] = Field(None, min_length=3)
    idnum: Optional[str] = None
    email: Optional[EmailStr] = None
    work_unit: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None

    @field_validator("fullname")
    @classmethod
    def validate_fullname(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Full name cannot be empty or just whitespace")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if not value.strip():
            raise ValueError("Password cannot be empty or just whitespace")
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if value.isdigit() or value.isalpha():
            raise ValueError("Password must contain both letters and numbers")
        if any(char.isspace() for char in value):
            raise ValueError("Password cannot contain whitespace characters")
        return value

class ManagerResponse(UserResponse):
    work_unit: Optional[str] = None