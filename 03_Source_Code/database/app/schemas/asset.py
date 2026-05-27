from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AssetBase(BaseModel):
    name: str

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None

class AssetResponse(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
