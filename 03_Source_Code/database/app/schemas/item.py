from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ItemBase(BaseModel):
    name: str
    category: str
    total_stock: int = 0
    available_stock: int = 0
    storeroom_location: Optional[str] = None
    condition: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    total_stock: Optional[int] = None
    available_stock: Optional[int] = None
    storeroom_location: Optional[str] = None
    condition: Optional[str] = None

class ItemResponse(ItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ExtraItemResponse(BaseModel):
    id_extraItem: int
    item: ItemResponse

    model_config = ConfigDict(from_attributes=True)

class ExtraItemCreate(BaseModel):
    item_id: int
