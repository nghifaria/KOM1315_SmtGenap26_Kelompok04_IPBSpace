import datetime
import os
from typing import Optional

import structlog
from fastapi import HTTPException, status

from app.core.security import Security
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import (
    FAILED_LOGIN_THRESHOLD,
    LOCK_DURATION_MINUTES,
    UserRepository,
)
from app.schemas.auth import AuthBase
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserInDB, UserLogin, UserResponse

logger = structlog.get_logger()


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        session_repository: SessionRepository,
    ):
        self.user_repository = user_repository
        self.session_repository = session_repository
        self.security = Security()

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    async def register(self, user_data: UserCreate) -> UserResponse:
        logger.info("registration_attempt", email=user_data.email)

        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            logger.warning("registration_failed_email_exists", email=user_data.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        hashed_password = self.security.hash_password(user_data.password)
        new_user = await self.user_repository.create(user_data, hashed_password)

        logger.info("registration_successful", email=user_data.email, user_id=new_user.id)
        return UserResponse.model_validate(new_user)

    # ------------------------------------------------------------------
    # Authentication (credential check + account locking)
    # ------------------------------------------------------------------

    async def authenticate(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None, # bisa buat audit log
        user_agent: Optional[str] = None, # bisa buat audit log
    ) -> Optional[UserInDB]:
        user = await self.user_repository.get_by_email(email)

        if not user:
            logger.warning("auth_failed_user_not_found", email=email)
            # Log without user_id to avoid leaking whether the account exists
            return None

        # -- Account lockout check ---------------------------------------
        now = datetime.datetime.now(datetime.timezone.utc)

        if user.locked_until:
            # Ensure both datetimes are tz-aware for comparison
            lock_expiry = user.locked_until
            if lock_expiry.tzinfo is None:
                lock_expiry = lock_expiry.replace(tzinfo=datetime.timezone.utc)

            if lock_expiry > now:
                remaining_seconds = int((lock_expiry - now).total_seconds())
                remaining_minutes = max(1, (remaining_seconds + 59) // 60)
                logger.warning(
                    "auth_failed_account_locked",
                    email=email,
                    user_id=user.id,
                    locked_until=user.locked_until.isoformat(),
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Account temporarily locked due to too many failed login attempts. "
                        f"Try again in {remaining_minutes} minute(s)."
                    ),
                )
            
            # lock expired
            await self.user_repository.reset_failed_login(user.id)

        # -- Password verification ---------------------------------------
        if not self.security.verify_password(password, user.hashed_password):
            new_count = await self.user_repository.increment_failed_login(user.id)

            if new_count >= FAILED_LOGIN_THRESHOLD:
                lock_until = now + datetime.timedelta(minutes=LOCK_DURATION_MINUTES)
                await self.user_repository.lock_user(user.id, lock_until)
                logger.warning(
                    "auth_failed_account_now_locked",
                    email=email,
                    user_id=user.id,
                    attempts=new_count,
                    locked_until=lock_until.isoformat(),
                )
            else:
                logger.warning(
                    "auth_failed_invalid_password",
                    email=email,
                    user_id=user.id,
                    attempts=new_count,
                    remaining=FAILED_LOGIN_THRESHOLD - new_count,
                )

            return None

        # -- Success: reset lock state ---------------------------------------
        await self.user_repository.reset_failed_login(user.id)
        await self.user_repository.update_last_login(user.id)

        return user  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Login (authenticate + create session + issue tokens)
    # ------------------------------------------------------------------

    async def login(
        self,
        user_login: UserLogin,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuthBase:
        """
        Authenticate a user, create a persistent session, and return token pair.

        :param user_login: Email + password credentials
        :param ip_address: Client IP address
        :param user_agent: Client User-Agent string
        :return: AuthBase containing token pair and user info
        :raises HTTPException 401: On invalid credentials
        """
        user = await self.authenticate(
            user_login.email,
            user_login.password,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Refresh ORM state to pick up last_login update
        await self.user_repository.refresh(user.id)

        # Issue token pair
        token_data = {"sub": str(user.id), "role": user.role}
        access_token, refresh_token = self.security.create_token_pair(token_data)

        # Persist session (store hashed refresh token)
        refresh_expires_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            days=refresh_expires_days
        )
        await self.session_repository.create_session(
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )

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
                last_login=user.last_login,
            ),
        )

    # ------------------------------------------------------------------
    # Token refresh (validate session + rotate access token)
    # ------------------------------------------------------------------

    async def refresh_access_token(self, refresh_token: str) -> Token:
        """
        Exchange a valid refresh token for a new access token.

        Validates:
        1. The refresh token JWT is well-formed and not expired.
        2. The token's ``type`` claim is "refresh".
        3. The session record in the DB is active (not revoked, not expired).

        :param refresh_token: Plain-text refresh token supplied by the client
        :return: New Token with a fresh access token (refresh token unchanged)
        :raises HTTPException 401: If the token or session is invalid
        """
        # Step 1: Decode & validate JWT signature / expiry
        payload = self.security.decode_token(refresh_token)

        # Step 2: Confirm token type
        token_type = payload.get("type")
        self.security.verify_token_type(token_type, "refresh")

        user_id = payload.get("sub")
        if not user_id:
            logger.warning("token_refresh_failed_missing_sub")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Step 3: Validate session in DB
        session = await self.session_repository.get_active_by_token(refresh_token)
        if not session:
            logger.warning("token_refresh_failed_session_not_found", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found or has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Guard against expired sessions that haven't been cleaned up yet
        now = datetime.datetime.now(datetime.timezone.utc)
        session_expires = session.expires_at
        if session_expires.tzinfo is None:
            session_expires = session_expires.replace(tzinfo=datetime.timezone.utc)
        if session_expires < now:
            logger.warning("token_refresh_failed_session_expired", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has expired — please log in again",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Step 4: Verify the user still exists
        user = await self.user_repository.get_by_id(int(user_id))
        if not user:
            logger.warning("token_refresh_failed_user_not_found", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Touch session activity timestamp
        await self.session_repository.touch_session(session)

        # Issue new access token
        new_access_token = self.security.create_access_token(
            {"sub": str(user_id), "role": user.role}
        )

        logger.info("token_refresh_successful", user_id=user_id)
        return Token(access_token=new_access_token, refresh_token=refresh_token)

    # ------------------------------------------------------------------
    # Logout (revoke session)
    # ------------------------------------------------------------------

    async def logout(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        # Best-effort decode (may be expired but session can still be revoked)
        user_id: Optional[str] = None
        try:
            payload = self.security.decode_token(refresh_token)
            user_id = payload.get("sub")
        except HTTPException:
            # Token is invalid/expired — still attempt to revoke by hash
            pass

        revoked = await self.session_repository.revoke_session_by_token(refresh_token)

        if revoked and user_id:
            logger.info("logout_successful", user_id=user_id)
        elif not revoked:
            logger.warning("logout_session_not_found", user_id=user_id)
