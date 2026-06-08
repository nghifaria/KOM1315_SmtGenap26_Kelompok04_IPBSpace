from fastapi import APIRouter, Depends, status, Request, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin
from app.schemas.http import HTTPResponse
from app.schemas.token import refreshTokenRequest
from app.api.dependencies import get_auth_service


# Create a login response schema compatible with OAuth2 / Swagger UI and Frontend
class LoginResponse(HTTPResponse):
    access_token: str
    token_type: str


router = APIRouter(prefix="/auth", tags=["auth"])


# helper
def _extract_client_info(request: Request) -> tuple[str | None, str | None]:
    """Return (ip_address, user_agent) from the incoming request."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip = (
        forwarded_for.split(",")[0].strip()
        if forwarded_for
        else (request.client.host if request.client else None)
    )
    ua = request.headers.get("User-Agent")
    return ip, ua


@router.post(
    "/register", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    data: UserCreate, service: AuthService = Depends(get_auth_service)
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
    return HTTPResponse(success=True, data={})


@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    background_tasks: BackgroundTasks,
    service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    """
    Endpoint to log in a user and provide access and refresh tokens.
    Supports both JSON body (Frontend) and Form URL Encoded (Swagger Authorize).
    """
    content_type = request.headers.get("content-type", "")

    if (
        "application/x-www-form-urlencoded" in content_type
        or "multipart/form-data" in content_type
    ):
        form_data = await request.form()
        email = form_data.get("username")
        password = form_data.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON body or content-type",
            )

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    ip, ua = _extract_client_info(request)
    user_login = UserLogin(email=email, password=password)

    try:
        auth_data = await service.login(user_login, ip_address=ip, user_agent=ua)
        background_tasks.add_task(
            service.record_login_log,
            email=email,
            status="SUCCESS",
            ip_address=ip,
            user_agent=ua,
        )

        return LoginResponse(
            success=True,
            data={
                "user": auth_data.data,
                "token": auth_data.token,
            },
            access_token=auth_data.token.access_token,
            token_type="bearer",
        )

    except HTTPException as e:
        background_tasks.add_task(
            service.record_login_log,
            email=email,
            status="FAILED",
            reason=e.detail,
            ip_address=ip,
            user_agent=ua,
        )

        raise e


@router.post("/refresh", response_model=HTTPResponse)
async def refresh_access_token(
    refresh_token: str, service: AuthService = Depends(get_auth_service)
) -> HTTPResponse:
    """
    Endpoint to refresh an access token using a valid refresh token.

    Example request body:
    {
        "refresh_token": "your_refresh_token_here"
    }
    """
    new_token = await service.refresh_access_token(refresh_token)
    return HTTPResponse(success=True, data={"token": new_token})


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
