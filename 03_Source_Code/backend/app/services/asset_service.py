from app.repositories.asset_repository import AssetRepository
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

class AssetService:
    def __init__(self, repository: AssetRepository):
        self.repository = repository

    async def list_assets(self):
        return await self.repository.get_all()

    async def get_asset(self, asset_id: int):
        return await self.repository.get_by_id(asset_id)

    async def add_asset(self, data: AssetCreate):
        new_asset = Asset(**data.model_dump())
        return await self.repository.create(new_asset)

    async def update_asset(self, asset_id: int, data: AssetUpdate):
        return await self.repository.update(asset_id, data.model_dump(exclude_unset=True))

    async def remove_asset(self, asset_id: int):
        return await self.repository.delete(asset_id)
