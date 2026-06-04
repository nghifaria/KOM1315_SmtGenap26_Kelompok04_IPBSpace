from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.extraItems import ExtraItems

class ExtraItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(ExtraItems).options(joinedload(ExtraItems.item))
        )
        return result.scalars().all()

    async def get_by_id(self, item_id: int):
        stmt = select(ExtraItems).where(ExtraItems.id_extraItem == item_id).options(joinedload(ExtraItems.item))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, extra_item: ExtraItems):
        self.db.add(extra_item)
        await self.db.commit()
        await self.db.refresh(extra_item)
        # Refresh with relationship
        stmt = select(ExtraItems).where(ExtraItems.id_extraItem == extra_item.id_extraItem).options(joinedload(ExtraItems.item))
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def delete(self, item_id: int):
        extra_item = await self.get_by_id(item_id)
        if extra_item:
            await self.db.delete(extra_item)
            await self.db.commit()
            return True
        return False
