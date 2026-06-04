from pydantic import BaseModel

from .user import UserResponse
from .token import Token

class AuthBase(BaseModel):
    """Base model for authentication-related responses, extending UserResponse with additional fields for token and data."""
    token: Token | None = None
    data: UserResponse | None = None

class AuthResponse(AuthBase):
    """Model for authentication response, extending AuthBase with success status and message."""
    success: bool
    message: str