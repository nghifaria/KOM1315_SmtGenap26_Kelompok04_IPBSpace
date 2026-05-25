from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.asset_repository import AssetRepository
from app.services.asset_service import AssetService
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.schemas.http import HTTPResponse
from app.api.dependencies import ensure_is_facility_manager, ensure_is_admin, ensure_is_admin_or_facility_manager

router = APIRouter(prefix="/assets", tags=["Assets"])

async def get_asset_service(db: AsyncSession = Depends(get_db)):
    repo = AssetRepository(db)
    return AssetService(repo)

@router.get("/", response_model=HTTPResponse)
async def get_all_assets(service: AssetService = Depends(get_asset_service)) -> HTTPResponse:
    """
    Endpoint to retrieve a list of all assets.
    """
    assets = await service.list_assets()
    return HTTPResponse(
        success=True,
        data={"items": [AssetResponse.model_validate(asset).model_dump(mode="json") for asset in assets]},
    )

@router.get("/{asset_id}", response_model=HTTPResponse)
async def get_asset_by_id(
    asset_id: int, 
    service: AssetService = Depends(get_asset_service)
    ) -> HTTPResponse:
    """
    Endpoint to retrieve an asset by its ID.
    """
    asset = await service.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return HTTPResponse(success=True, data={"asset": AssetResponse.model_validate(asset).model_dump(mode="json")})

@router.post("/", response_model=HTTPResponse)
async def create_asset(
    data: AssetCreate, 
    service: AssetService = Depends(get_asset_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    """
    Endpoint to create a new asset. Requires facility manager privileges.
    """
    asset = await service.add_asset(data)
    return HTTPResponse(success=True, data={"asset": AssetResponse.model_validate(asset).model_dump(mode="json")})

@router.put("/{asset_id}", response_model=HTTPResponse)
async def update_asset(
    asset_id: int, 
    data: AssetUpdate, 
    service: AssetService = Depends(get_asset_service),
    _: bool = Depends(ensure_is_admin_or_facility_manager)
    ) -> HTTPResponse:
    """
    Endpoint to update an existing asset. Requires facility manager or admin privileges.
    """
    asset = await service.update_asset(asset_id, data)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return HTTPResponse(success=True, data={"asset": AssetResponse.model_validate(asset).model_dump(mode="json")})

@router.delete("/{asset_id}", response_model=HTTPResponse)
async def delete_asset(
    asset_id: int, 
    service: AssetService = Depends(get_asset_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    """
    Endpoint to delete an asset. Requires admin privileges.
    """
    success = await service.remove_asset(asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return HTTPResponse(success=True, data={"message": "Asset deleted successfully"})
