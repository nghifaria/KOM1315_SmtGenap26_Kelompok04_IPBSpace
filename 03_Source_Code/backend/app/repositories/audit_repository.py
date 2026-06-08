import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.logs import LoginLog


class AuditRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_login_log(
        self,
        email: str,
        status: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        user_id: int | None = None,
        reason: str | None = None,
    ) -> LoginLog:
        now = datetime.datetime.now(datetime.timezone.utc)
        log_entry = LoginLog(
            email=email,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            reason=reason,
            created_at=now,
        )
        self.db.add(log_entry)
        await self.db.commit()
        return log_entry

    async def get_login_logs(self, limit: int = 100) -> list[LoginLog]:
        stmt = select(LoginLog).order_by(LoginLog.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
