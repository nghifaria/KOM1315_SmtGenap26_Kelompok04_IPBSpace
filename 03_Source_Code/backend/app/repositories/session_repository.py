import datetime
import hashlib
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.session import UserSession


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def create_session(
        self,
        user_id: int,
        refresh_token: str,
        expires_at: datetime.datetime,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserSession:
        now = datetime.datetime.now(datetime.timezone.utc)
        session = UserSession(
            user_id=user_id,
            refresh_token_hash=self._hash_token(refresh_token),
            ip_address=ip_address,
            user_agent=user_agent,
            is_revoked=False,
            created_at=now,
            expires_at=expires_at,
            last_used_at=now,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session


    async def revoke_session_by_token(self, refresh_token: str) -> bool:
        session = await self.get_active_by_token(refresh_token)
        if not session:
            return False
        await self._revoke(session)
        return True


    async def revoke_all_for_user(self, user_id: int) -> int:
        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.is_revoked.is_(False),
            UserSession.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        sessions = result.scalars().all()

        now = datetime.datetime.now(datetime.timezone.utc)
        for s in sessions:
            s.is_revoked = True
            s.revoked_at = now

        await self.db.commit()
        return len(sessions)


    async def touch_session(self, session: UserSession) -> None:
        session.last_used_at = datetime.datetime.now(datetime.timezone.utc)
        await self.db.commit()


    async def get_active_by_token(self, refresh_token: str) -> Optional[UserSession]:
        token_hash = self._hash_token(refresh_token)
        stmt = select(UserSession).where(
            UserSession.refresh_token_hash == token_hash,
            UserSession.is_revoked.is_(False),
            UserSession.deleted_at.is_(None),
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def _revoke(self, session: UserSession) -> None:
        now = datetime.datetime.now(datetime.timezone.utc)
        session.is_revoked = True
        session.revoked_at = now
        await self.db.commit()
