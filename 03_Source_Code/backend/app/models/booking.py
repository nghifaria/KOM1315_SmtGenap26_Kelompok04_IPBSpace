from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from sqlalchemy import Integer, String, DateTime
from datetime import datetime
from sqlalchemy import func
from app.enums.status_approval import StatusApproval
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.items import Items
    from app.models.asset import Asset

class BookingItem(Base):
    __tablename__ = "booking_items"
    booking_id: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.id"), primary_key=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey("items.id"), primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="extra_items")
    item: Mapped["Items"] = relationship("Items")

class Booking(Base):
    __tablename__ = "bookings"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=True)

    purpose : Mapped[str] = mapped_column(String, nullable=False)
    number_of_attendees : Mapped[int] = mapped_column(Integer, nullable=False)
    document_url : Mapped[str] = mapped_column(String, nullable=True)
    fee : Mapped[int] = mapped_column(Integer, nullable=True)
    status : Mapped[str] = mapped_column(String, default=StatusApproval.PENDING.value, nullable=False)
    reason : Mapped[str | None] = mapped_column(String, nullable=True)
    validated_by : Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_booking : Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    start_time : Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time : Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Handover fields
    handover_token : Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    handover_expires_at : Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    facility = relationship("Facility")
    user = relationship("User")
    asset: Mapped["Asset"] = relationship("Asset")
    extra_items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")

    created_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at : Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())