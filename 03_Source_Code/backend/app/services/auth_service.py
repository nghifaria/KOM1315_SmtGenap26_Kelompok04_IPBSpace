from fastapi import HTTPException, status
from typing import Optional
import structlog

from app.repositories.user_repository import UserRepository
from app.core.security import Security
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserInDB
from app.schemas.token import Token
from app.schemas.auth import AuthBase

logger = structlog.get_logger()

class AuthService:
    """
    Service class for handling authentication-related operations, such as user login and session management.
    """

    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.security = Security()

    async def register(self, user_data: UserCreate) -> UserResponse:
        """
        Registers a new user.
        
        :param user_data: The UserCreate schema containing user information for registration
        :type user_data: UserCreate
        :return: The registered UserResponse object (without password)
        :rtype: UserResponse
        """
        logger.info("registration_attempt", email=user_data.email)
        # Check if the email is already registered
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            logger.warning("registration_failed_email_exists", email=user_data.email)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        # Hash the user's password before storing it
        hashed_password = self.security.hash_password(user_data.password)
        
        # Create the user in the database
        new_user = await self.user_repository.create(user_data, hashed_password)

        logger.info("registration_successful", email=user_data.email, user_id=new_user.id)
        return UserResponse.model_validate(new_user)
    
    async def authenticate(self, email: str, password: str) -> Optional[UserInDB]:
        """
        Authenticates a user by their email and password.
        
        :param email: The email address of the user to authenticate
        :type email: str
        :param password: The plain text password to verify
        :type password: str
        :return: The authenticated UserInDB object if credentials are valid, otherwise None
        :rtype: Optional[UserInDB]
        """
        # Retrieve the user by email
        user = await self.user_repository.get_by_email(email)
        if not user:
            logger.warning("auth_failed_user_not_found", email=email)
            return None
        
        # Verify the provided password against the stored hashed password
        if not self.security.verify_password(password, user.hashed_password):
            logger.warning("auth_failed_invalid_password", email=email, user_id=user.id)
            return None
        
        # Update the last login timestamp
        await self.user_repository.update_last_login(user.id)

        return user
    
    async def login(self, user_login: UserLogin) -> AuthBase:
        """
        Handles user login by authenticating the user and generating tokens.
        
        :param user_login: The UserLogin schema containing email and password for login
        :type user_login: UserLogin
        :return: The generated AuthBase object (containing token information) if authentication is successful, otherwise raises an HTTPException
        :rtype: AuthBase
        """
        # Authenticate the user
        user = await self.authenticate(user_login.email, user_login.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        await self.user_repository.refresh(user.id) # Refresh the user instance to get the latest data, including last_login timestamp

        # Generate tokens
        access_token, refresh_token = self.security.create_token_pair({"sub": str(user.id), "role": user.role})

        logger.info("login_successful", email=user.email, user_id=user.id, role=user.role)
        return AuthBase(
            token=Token(access_token=access_token, refresh_token=refresh_token),
            data=UserResponse(
                id=user.id,
                email=user.email,
                fullname=user.fullname,
                idnum=user.idnum,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login
            )
        )

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """
        Get a new access token using a valid refresh token.

        :param refresh_token: The refresh token to validate and use for generating a new access token
        :type refresh_token: str
        :return: A new Token object containing the refreshed access token and the same refresh token if successful, otherwise raises an HTTPException
        :rtype: Token
        """
        # Verify the provided refresh token
        if not self.security.verify_token_type(refresh_token, "refresh"):
            logger.warning("token_refresh_failed_invalid_type")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid or expired refresh token", 
                headers={"WWW-Authenticate": "Bearer"}
            )

        # Decode the refresh token to get the user information
        payload = self.security.decode_token(refresh_token)

        user_id = payload.get("sub")

        if not user_id:
            logger.warning("token_refresh_failed_missing_sub")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid refresh token: missing user ID", 
                headers={"WWW-Authenticate": "Bearer"}
            )

        user = await self.user_repository.get_by_id(user_id)     
        if not user:
            logger.warning("token_refresh_failed_user_not_found", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid refresh token: user not found", 
                headers={"WWW-Authenticate": "Bearer"}
            )

        # Generate a new access token using the user information from the refresh token
        new_access_token = self.security.create_access_token({"sub": str(user_id), "role": user.role})

        logger.info("token_refresh_successful", user_id=user_id)
        return Token(
            access_token=new_access_token,
            refresh_token=refresh_token
        )