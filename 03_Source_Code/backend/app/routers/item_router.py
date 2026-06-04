from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.item_repository import ItemRepository
from app.repositories.extra_item_repository import ExtraItemRepository
from app.services.item_service import ItemService
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ExtraItemCreate, ExtraItemResponse
from app.schemas.http import HTTPResponse
from app.api.dependencies import ensure_is_admin, ensure_is_admin_or_facility_manager, ensure_is_facility_manager

router = APIRouter(prefix="/items", tags=["Items"])

async def get_item_service(db: AsyncSession = Depends(get_db)):
    item_repo = ItemRepository(db)
    extra_repo = ExtraItemRepository(db)
    return ItemService(item_repo, extra_repo)

# Item Endpoints
@router.get("/", response_model=HTTPResponse)
async def get_all_items(service: ItemService = Depends(get_item_service)) -> HTTPResponse:
    items = await service.list_items()
    return HTTPResponse(
        success=True,
        data={"items": [ItemResponse.model_validate(item).model_dump(mode="json") for item in items]},
    )

@router.get("/{item_id}", response_model=HTTPResponse)
async def get_item_by_id(item_id: int, service: ItemService = Depends(get_item_service)) -> HTTPResponse:
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return HTTPResponse(success=True, data={"item": ItemResponse.model_validate(item).model_dump(mode="json")})

@router.post("/", response_model=HTTPResponse)
async def create_item(
    data: ItemCreate, 
    service: ItemService = Depends(get_item_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    item = await service.add_item(data)
    return HTTPResponse(success=True, data={"item": ItemResponse.model_validate(item).model_dump(mode="json")})

@router.put("/{item_id}", response_model=HTTPResponse)
async def update_item(
    item_id: int, 
    data: ItemUpdate, 
    service: ItemService = Depends(get_item_service),
    _: bool = Depends(ensure_is_admin_or_facility_manager)
    ) -> HTTPResponse:
    item = await service.update_item(item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return HTTPResponse(success=True, data={"item": ItemResponse.model_validate(item).model_dump(mode="json")})

@router.delete("/{item_id}", response_model=HTTPResponse)
async def delete_item(
    item_id: int, 
    service: ItemService = Depends(get_item_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    success = await service.remove_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return HTTPResponse(success=True, data={"message": "Item deleted successfully"})

# Extra Item Endpoints
@router.get("/extra/all", response_model=HTTPResponse)
async def get_all_extra_items(
    start_time: str = None,
    end_time: str = None,
    service: ItemService = Depends(get_item_service)
) -> HTTPResponse:
    parsed_start = None
    parsed_end = None
    if start_time and end_time:
        try:
            from datetime import datetime
            parsed_start = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            parsed_end = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
        except ValueError:
            pass

    extra_items = await service.list_extra_items(parsed_start, parsed_end)
    return HTTPResponse(
        success=True,
        data={"extra_items": [ExtraItemResponse.model_validate(ei).model_dump(mode="json") for ei in extra_items]},
    )

@router.post("/extra/", response_model=HTTPResponse)
async def create_extra_item(
    data: ExtraItemCreate, 
    service: ItemService = Depends(get_item_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    extra_item = await service.add_extra_item(data)
    if not extra_item:
        raise HTTPException(status_code=404, detail="Item not found or failed to create extra item")
    return HTTPResponse(success=True, data={"extra_item": ExtraItemResponse.model_validate(extra_item).model_dump(mode="json")})

@router.delete("/extra/{item_id}", response_model=HTTPResponse)
async def delete_extra_item(
    item_id: int, 
    service: ItemService = Depends(get_item_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    success = await service.remove_extra_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Extra item not found")
    return HTTPResponse(success=True, data={"message": "Extra item removed successfully"})
