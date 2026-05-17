from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.facility import Facility
from app.models.facilityAsset import FacilityAsset

class FacilityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        stmt = select(Facility).options(
            joinedload(Facility.facility_assets).joinedload(FacilityAsset.asset)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().all()

    async def get_by_id(self, facility_id: int):
        stmt = select(Facility).where(Facility.id == facility_id).options(
            joinedload(Facility.facility_assets).joinedload(FacilityAsset.asset)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().first()

    async def create(self, facility_data: Facility):
        self.db.add(facility_data)
        await self.db.commit()
        await self.db.refresh(facility_data)
        return facility_data