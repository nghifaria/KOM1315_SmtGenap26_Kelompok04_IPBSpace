from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """Model for JWT token response, containing access and refresh tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    """Model for the payload contained in JWT tokens, including user ID and role."""
    sub: Optional[int] = None  # User ID
    role: Optional[str] = None  # User role (obtained from UserRoles enum)
    exp: Optional[int] = None  # Expiration time (timestamp)
    type: Optional[str] = None  # Token type (access or refresh)

class refreshTokenRequest(BaseModel):
    """Model for refresh token request, containing the refresh token string."""
    refresh_token: str

class TokenResponse(BaseModel):
    """Model for token response, containing the new access token and refresh token."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"