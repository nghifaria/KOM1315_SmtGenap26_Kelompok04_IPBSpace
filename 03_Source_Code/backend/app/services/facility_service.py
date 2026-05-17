from app.repositories.facility_repository import FacilityRepository
from app.repositories.asset_repository import AssetRepository
from app.models.facility import Facility
from app.schemas.facility import FacilityCreate, FacilityUpdate
from app.storage.document_storage import DocumentStorage
from fastapi import HTTPException, UploadFile

class FacilityService:
    def __init__(
        self, 
        repository: FacilityRepository, 
        asset_repository: AssetRepository,
        document_storage: DocumentStorage
    ):
        self.repository = repository
        self.asset_repository = asset_repository
        self.document_storage = document_storage

    async def list_facilities(self):
        return await self.repository.get_all()

    async def get_facility(self, facility_id: int):
        facility = await self.repository.get_by_id(facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")
        return facility

    async def add_facility(
        self, 
        data: FacilityCreate, 
        image: UploadFile | None = None
    ):
        asset_ids = data.asset_ids
        facility_dict = data.model_dump(exclude={"asset_ids", "image_url"})

        image_url = None
        if image:
            image_url = await self.document_storage.upload_facility_image(image)

        new_facility = Facility(**facility_dict, image_url=image_url)

        if asset_ids:
            for aid in asset_ids:
                asset = await self.asset_repository.get_by_id(aid)
                if asset:
                    new_facility.assets.append(asset)

        return await self.repository.create(new_facility)

    async def update_facility(
        self, 
        facility_id: int, 
        data: FacilityUpdate, 
        image: UploadFile | None = None
    ):
        facility = await self.repository.get_by_id(facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")

        update_data = data.model_dump(exclude_unset=True)
        asset_ids = update_data.pop("asset_ids", None)

        # Handle image update
        if image:
            # Delete old image if exists
            if facility.image_url:
                await self.document_storage.delete_facility_image(facility.image_url)

            image_url = await self.document_storage.upload_facility_image(image)
            facility.image_url = image_url

        for key, value in update_data.items():
            setattr(facility, key, value)

        if asset_ids is not None:
            # Clear existing assets
            facility.assets = []
            for aid in asset_ids:
                asset = await self.asset_repository.get_by_id(aid)
                if asset:
                    facility.assets.append(asset)

        await self.repository.db.commit()
        await self.repository.db.refresh(facility)
        return facility

    async def delete_facility(self, facility_id: int):
        facility = await self.repository.get_by_id(facility_id)
        if not facility:
            raise HTTPException(status_code=404, detail="Facility not found")

        # Delete image from storage if exists
        if facility.image_url:
            await self.document_storage.delete_facility_image(facility.image_url)

        await self.repository.db.delete(facility)
        await self.repository.db.commit()
        return True