from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.schemas.asset import AssetResponse

class FacilityCreate(BaseModel):
    name: str
    code: str
    location: str
    capacity: int
    threshold: Optional[int] = 0
    image_url: Optional[str] = None
    condition: Optional[str] = None
    contact_person: Optional[str] = None
    asset_ids: Optional[List[int]] = []


class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    threshold: Optional[int] = None
    image_url: Optional[str] = None
    condition: Optional[str] = None
    contact_person: Optional[str] = None
    asset_ids: Optional[List[int]] = None


class FacilityResponse(BaseModel):
    id: int
    name: str
    code: str
    location: str
    capacity: int
    threshold: int
    image_url: Optional[str] = None
    condition: Optional[str] = None
    contact_person: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    assets: List[AssetResponse] = []

    model_config = ConfigDict(from_attributes=True)