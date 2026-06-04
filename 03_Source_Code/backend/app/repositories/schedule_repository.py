from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.schedule import Schedule

class ScheduleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(Schedule))
        return result.scalars().all()

    async def get_by_id(self, schedule_id: int):
        stmt = select(Schedule).where(Schedule.id == schedule_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, schedule_data: Schedule):
        self.db.add(schedule_data)
        await self.db.commit()
        await self.db.refresh(schedule_data)
        return schedule_data

    async def delete(self, schedule_id: int):
        schedule = await self.get_by_id(schedule_id)
        if schedule:
            await self.db.delete(schedule)
            await self.db.commit()
            return True
        return False

    async def update(self, schedule_id: int, updated_data: dict):
        schedule = await self.get_by_id(schedule_id)
        if schedule:
            for key, value in updated_data.items():
                setattr(schedule, key, value)
            await self.db.commit()
            await self.db.refresh(schedule)
            return schedule
        return None