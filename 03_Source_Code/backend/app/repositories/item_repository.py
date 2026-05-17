from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.items import Items

class ItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(Items))
        return result.scalars().all()

    async def get_by_id(self, item_id: int):
        stmt = select(Items).where(Items.id == item_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, item_data: Items):
        self.db.add(item_data)
        await self.db.commit()
        await self.db.refresh(item_data)
        return item_data

    async def delete(self, item_id: int):
        item = await self.get_by_id(item_id)
        if item:
            await self.db.delete(item)
            await self.db.commit()
            return True
        return False

    async def update(self, item_id: int, updated_data: dict):
        item = await self.get_by_id(item_id)
        if item:
            for key, value in updated_data.items():
                setattr(item, key, value)
            await self.db.commit()
            await self.db.refresh(item)
            return item
        return None