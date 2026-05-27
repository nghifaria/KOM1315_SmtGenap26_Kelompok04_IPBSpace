from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import Security
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse
from app.repositories import user_repository, session_repository
from app.enums.user_enums import UserRoles
from app.core.logging import logger

# OAuth2 scheme for token-based authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    repo = user_repository.UserRepository(db)
    return UserService(repo)

async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    user_repo = user_repository.UserRepository(db)
    session_repo = session_repository.SessionRepository(db)
    return AuthService(
        user_repo,
        session_repo,
    )

async def get_current_user(
        token: str = Depends(oauth2_scheme),
        security: Security = Depends(Security),
        user_service: UserService = Depends(get_user_service),
) -> UserResponse:
    """
    Dependency function to retrieve the current authenticated user based on the provided token.
    
    :param token: The OAuth2 token extracted from the request header
    :type token: str
    :param db: The database session dependency
    :type db: AsyncSession
    :return: The UserResponse object representing the current authenticated user
    :rtype: UserResponse
    :raises HTTPException: If the token is invalid or the user is not found
    """
    # print(f"DEBUG: Token received by FastAPI: '{token}'")

    # Decode and validate the token 
    # print(f"DEBUG: Original token: {token}")
    payload = security.decode_token(token)
    # print(f"DEBUG: Payload extracted from token: {payload}")

    # Get the user ID from the token payload
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing user ID")
    
    # Retrieve the user from the database
    current_user = await user_service.get_current_user(int(user_id))
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return current_user

def ensure_is_admin(current_user: UserResponse = Depends(get_current_user)) -> bool:
    """
    Dependency function to ensure the current authenticated user has admin privileges.
    
    :param current_user: The current active user retrieved from the get_current_user dependency
    :type current_user: UserResponse
    :raises HTTPException: If the user does not have admin privileges
    """
    if current_user.role != UserRoles.ADMIN:
        logger.warning("admin_access_denied", user_id=current_user.id)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return True
    
def ensure_is_facility_manager(current_user: UserResponse = Depends(get_current_user)):
    """
    Dependency function to ensure the current authenticated user has facility manager privileges.
    
    :param current_user: The current active user retrieved from the get_current_user dependency
    :type current_user: UserResponse
    :raises HTTPException: If the user does not have facility manager privileges
    """
    if current_user.role != UserRoles.FACILITY_MANAGER:
        logger.warning("facility_manager_access_denied", user_id=current_user.id)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    
def ensure_is_admin_or_facility_manager(current_user: UserResponse = Depends(get_current_user)):
    """
    Dependency function to ensure the current authenticated user has either admin or facility manager privileges.
    
    :param current_user: The current active user retrieved from the get_current_user dependency
    :type current_user: UserResponse
    :raises HTTPException: If the user does not have admin or facility manager privileges
    """
    if current_user.role not in [UserRoles.ADMIN, UserRoles.FACILITY_MANAGER]:
        logger.warning("admin_or_facility_manager_access_denied", user_id=current_user.id)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")