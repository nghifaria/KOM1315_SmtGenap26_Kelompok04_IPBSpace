from fastapi import APIRouter, Depends, status, Request

from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin
from app.schemas.http import HTTPResponse
from app.schemas.token import refreshTokenRequest
from app.api.dependencies import get_auth_service


router = APIRouter(prefix="/auth", tags=["auth"])

# helper
def _extract_client_info(request: Request) -> tuple[str | None, str | None]:
    """Return (ip_address, user_agent) from the incoming request."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else (
        request.client.host if request.client else None
    )
    ua = request.headers.get("User-Agent")
    return ip, ua


@router.post("/register", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserCreate,
    service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to register a new user.

    Example request body:
    {
        "fullname": "John Doe",
        "idnum": "12345678",
        "email": "john.doe@ipbspace.com",
        "password": "SecurePassword123", 
        "role": "civitas"
    }

    rules for password:
    - Cannot be empty
    - Must be at least 8 characters long
    - Must contain both letters and numbers
    - Cannot contain whitespace characters
    """
    await service.register(data)
    return HTTPResponse(
        success=True,
        data={}
    )

@router.post("/login", response_model=HTTPResponse)
async def login(
    data: UserLogin,
    service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to log in a user and provide access and refresh tokens.

    Example request body:
    {
        "email": "john.doe@ipbspace.com",
        "password": "SecurePassword123"
    }
    """
    auth_data = await service.login(data)
    
    return HTTPResponse(
        success=True,
        data={
            "user": auth_data.data,
            "token": auth_data.token,
        }
    )

@router.post("/refresh", response_model=HTTPResponse)
async def refresh_access_token(
    refresh_token: str,
    service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to refresh an access token using a valid refresh token.

    Example request body:
    {
        "refresh_token": "your_refresh_token_here"
    }
    """
    new_token = await service.refresh_access_token(refresh_token)
    return HTTPResponse(
        success=True,
        data={"token": new_token}
    )



@router.post("/logout", response_model=HTTPResponse)
async def logout(
    body: refreshTokenRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> HTTPResponse:
    """
    Revoke the current session identified by the refresh token.
    The client should discard both the access token and refresh token after calling this.
    """
    ip, ua = _extract_client_info(request)
    await service.logout(body.refresh_token, ip_address=ip, user_agent=ua)
    return HTTPResponse(success=True, data={"message": "Logged out successfully"})
