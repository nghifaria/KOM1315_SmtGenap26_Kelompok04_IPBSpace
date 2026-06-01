from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.item import ItemResponse


class BookingCreate(BaseModel):
    purpose: str = Field(..., min_length=3)
    number_of_attendees: int = Field(..., ge=1)
    fee: int | None = Field(default=None, ge=0)
    date_of_booking: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # Format: YYYY-MM-DD
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # Format: HH:MM
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")  # Format: HH:MM

class BookingItemResponse(BaseModel):
    booking_id: int
    item_id: int
    quantity: int
    item: ItemResponse

    model_config = ConfigDict(from_attributes=True)

class BookingResponse(BaseModel):
    id: int
    facility_id: int
    user_id: int
    purpose: str
    number_of_attendees: int
    document_url: str | None = None
    fee: int | None = None
    status: str
    reason: str | None = None
    validated_by: str | None = None
    date_of_booking: datetime
    start_time: datetime
    end_time: datetime
    created_at: datetime
    updated_at: datetime | None = None
    extra_items: List[BookingItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class BookingStatusUpdate(BaseModel):
    new_status: str = Field(..., pattern="^(pending|approved|rejected|canceled|checked-in)$")
    reason: Optional[str] = None
