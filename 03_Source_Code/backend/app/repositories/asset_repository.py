from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.asset import Asset

class AssetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(Asset))
        return result.scalars().all()

    async def get_by_id(self, asset_id: int):
        stmt = select(Asset).where(Asset.id == asset_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create(self, asset_data: Asset):
        self.db.add(asset_data)
        await self.db.commit()
        await self.db.refresh(asset_data)
        return asset_data
    
    async def delete(self, asset_id: int):
        asset = await self.get_by_id(asset_id)
        if asset:
            await self.db.delete(asset)
            await self.db.commit()
            return True
        return False
    
    async def update(self, asset_id: int, updated_data: dict):
        asset = await self.get_by_id(asset_id)
        if asset:
            for key, value in updated_data.items():
                setattr(asset, key, value)
            await self.db.commit()
            await self.db.refresh(asset)
            return asset
        return None