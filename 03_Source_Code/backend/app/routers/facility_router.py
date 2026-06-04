from fastapi import APIRouter, Depends, status, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.facility_repository import FacilityRepository
from app.repositories.asset_repository import AssetRepository
from app.services.facility_service import FacilityService
from app.schemas.facility import FacilityCreate, FacilityUpdate, FacilityResponse
from app.schemas.http import HTTPResponse
from app.api.dependencies import ensure_is_admin, ensure_is_admin_or_facility_manager, ensure_is_facility_manager
from app.storage.factory import get_document_storage
import json
from typing import List, Optional

router = APIRouter(prefix="/facilities", tags=["Facilities"])

async def get_facility_service(db: AsyncSession = Depends(get_db)):
    repo = FacilityRepository(db)
    asset_repo = AssetRepository(db)
    storage = get_document_storage()
    return FacilityService(repo, asset_repo, storage)

@router.get("/", response_model=HTTPResponse)
async def get_all_facilities(service: FacilityService = Depends(get_facility_service)) -> HTTPResponse:
    """
    Endpoint to retrieve a list of all facilities.
    """
    facilities = await service.list_facilities()
    return HTTPResponse(
        success=True,
        data={"items": [FacilityResponse.model_validate(facility).model_dump(mode="json") for facility in facilities]},
    )

@router.get("/{facility_id}", response_model=HTTPResponse)
async def get_facility_by_id(
    facility_id: int, 
    service: FacilityService = Depends(get_facility_service)
    ) -> HTTPResponse:
    """
    Endpoint to retrieve a specific facility by its ID.
    """
    facility = await service.get_facility(facility_id)
    return HTTPResponse(
        success=True, 
        data={"facility": FacilityResponse.model_validate(facility).model_dump(mode="json")}
    )

@router.post("/", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED)
async def create_facility(
    name: str = Form(...),
    code: str = Form(...),
    location: str = Form(...),
    capacity: int = Form(...),
    threshold: int = Form(0),
    condition: Optional[str] = Form(None),
    contact_person: Optional[str] = Form(None),
    asset_ids: Optional[str] = Form("[]"), # Expecting JSON string for list
    image: Optional[UploadFile] = File(None),
    service: FacilityService = Depends(get_facility_service),
    _: bool = Depends(ensure_is_admin)
    ) -> HTTPResponse:
    """
    Endpoint to create a new facility with an optional image. Requires admin privileges.
    """
    if asset_ids is None:
        parsed_asset_ids = []
    else:
        try:
            parsed_asset_ids = json.loads(asset_ids)
        except json.JSONDecodeError:
            parsed_asset_ids = []

    data = FacilityCreate(
        name=name,
        code=code,
        location=location,
        capacity=capacity,
        threshold=threshold,
        condition=condition,
        contact_person=contact_person,
        asset_ids=parsed_asset_ids
    )

    facility = await service.add_facility(data, image)
    return HTTPResponse(success=True, data={"facility": FacilityResponse.model_validate(facility).model_dump(mode="json")})

@router.put("/{facility_id}", response_model=HTTPResponse)
async def update_facility(
    facility_id: int,
    name: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    capacity: Optional[int] = Form(None),
    threshold: Optional[int] = Form(None),
    condition: Optional[str] = Form(None),
    contact_person: Optional[str] = Form(None),
    asset_ids: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    service: FacilityService = Depends(get_facility_service),
    _: bool = Depends(ensure_is_admin_or_facility_manager)
) -> HTTPResponse:
    """
    Endpoint to update an existing facility. Requires admin or facility manager privileges.
    """
    update_dict = {}
    if name is not None: update_dict["name"] = name
    if code is not None: update_dict["code"] = code
    if location is not None: update_dict["location"] = location
    if capacity is not None: update_dict["capacity"] = capacity
    if threshold is not None: update_dict["threshold"] = threshold
    if condition is not None: update_dict["condition"] = condition
    if contact_person is not None: update_dict["contact_person"] = contact_person
    if asset_ids is not None:
        try:
            update_dict["asset_ids"] = json.loads(asset_ids)
        except json.JSONDecodeError:
            pass

    data = FacilityUpdate(**update_dict)
    facility = await service.update_facility(facility_id, data, image)
    return HTTPResponse(success=True, data={"facility": FacilityResponse.model_validate(facility).model_dump(mode="json")})

@router.delete("/{facility_id}", response_model=HTTPResponse)
async def delete_facility(
    facility_id: int,
    service: FacilityService = Depends(get_facility_service),
    _: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    """
    Endpoint to delete a facility. Requires admin privileges.
    """
    await service.delete_facility(facility_id)
    return HTTPResponse(success=True, data={"message": "Facility deleted successfully"})