import secrets
from datetime import datetime, timedelta, timezone
from typing import Sequence
import asyncio
import structlog

from fastapi import HTTPException, UploadFile, status

from app.models.booking import Booking
from app.repositories.booking_repository import BookingRepository
from app.repositories.facility_repository import FacilityRepository
from app.repositories.user_repository import UserRepository
from app.storage.document_storage import DocumentStorage
from app.enums.status_approval import StatusApproval
from app.services.mail_service import MailService
from app.core.config import settings
from app.core.database import AsyncSessionLocal

import os
from dotenv import load_dotenv

load_dotenv()
HARDCODE_MAIL_RECIPIENT = os.getenv("HARDCODE_MAIL_RECIPIENT", "") 

logger = structlog.get_logger()

class BookingService:
    def __init__(
        self,
        booking_repository: BookingRepository,
        facility_repository: FacilityRepository,
        user_repository: UserRepository,
        document_storage: DocumentStorage,
        mail_service: MailService,
    ):
        self.booking_repository = booking_repository
        self.facility_repository = facility_repository
        self.user_repository = user_repository
        self.document_storage = document_storage
        self.mail_service = mail_service

    async def create_booking(
        self,
        facility_id: int,
        user_id: int,
        purpose: str,
        number_of_attendees: int,
        document: UploadFile,
        date_of_booking: datetime,
        start_time: datetime,
        end_time: datetime,
        fee: int | None = None,
        extra_items: list | None = None
    ) -> Booking:
        logger.info("booking_creation_attempt", facility_id=facility_id, user_id=user_id, date=date_of_booking.isoformat())
        facility = await self.facility_repository.get_by_id(facility_id)
        if not facility:
            logger.warning("booking_creation_failed_facility_not_found", facility_id=facility_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        purpose = purpose.strip()
        if len(purpose) < 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Purpose must be at least 3 characters")

        if number_of_attendees < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Number of attendees must be at least 1")

        content_type = (document.content_type or "").lower()
        if content_type not in {"application/pdf", "image/jpeg", "image/png"}:
            await document.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document must be a PDF, JPG, or PNG file",
            )

        document_url = await self.document_storage.upload_booking_document(document)

        new_booking = Booking(
            facility_id=facility_id,
            user_id=user_id,
            purpose=purpose,
            number_of_attendees=number_of_attendees,
            document_url=document_url,
            fee=fee,
            date_of_booking=date_of_booking,
            start_time=start_time,
            end_time=end_time,
        )

        # Process extra items
        if extra_items:
            from app.models.booking import BookingItem
            from app.repositories.item_repository import ItemRepository
            from app.repositories.extra_item_repository import ExtraItemRepository
            from app.services.item_service import ItemService

            db = self.booking_repository.db
            item_repo = ItemRepository(db)
            extra_repo = ExtraItemRepository(db)
            item_service = ItemService(item_repo, extra_repo)

            dynamic_extras = await item_service.list_extra_items(start_time, end_time)
            dynamic_avail = {ei.item.id: ei.item.available_stock for ei in dynamic_extras if ei.item}

            for item_data in extra_items:
                # expecting a dict like {"itemId": 1, "quantity": 2}
                item_id = item_data.get("itemId")
                qty = item_data.get("quantity", 1)
                if item_id:
                    item_id_int = int(item_id)
                    max_avail = dynamic_avail.get(item_id_int, 0)
                    if int(qty) > max_avail:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Stok barang tambahan tidak mencukupi untuk slot waktu ini. Maksimal tersedia: {max_avail} unit."
                        )
                    booking_item = BookingItem(item_id=item_id_int, quantity=int(qty))
                    new_booking.extra_items.append(booking_item)

        created_booking = await self.booking_repository.create(new_booking)

        if not created_booking:
            logger.error("booking_creation_failed_db_error", facility_id=facility_id, user_id=user_id)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create booking")

        logger.info("booking_creation_successful", booking_id=created_booking.id, facility_id=facility_id, user_id=user_id)
        return created_booking
      
    
    async def get_facility_booking_queue(self, facility_id: int):
        facility = await self.facility_repository.get_by_id(facility_id)
        if not facility:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
        return await self.booking_repository.get_bookings_by_facility_id(facility_id)
    
    async def get_all_bookings(self) -> Sequence[Booking]:
        return await self.booking_repository.get_all()

    async def get_booking_by_id(self, booking_id: int) -> Booking:
        booking = await self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        return booking

    async def delete_booking(self, booking_id: int) -> bool:
        booking = await self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
        # Delete document from storage if exists
        if booking.document_url:
            await self.document_storage.delete_booking_document(booking.document_url)

        return await self.booking_repository.delete(booking_id)

    async def delete_booking_document(self, booking_id: int) -> bool:
        booking = await self.booking_repository.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        
        if not booking.document_url:
            return False
            
        success = await self.document_storage.delete_booking_document(booking.document_url)
        if success:
            await self.booking_repository.update(booking_id, {"document_url": None})
            
        return success

    async def update_booking_status(self, booking_id: int, new_status: str, reason: str | None = None, validated_by: str | None = None, force: bool = False):
        old_booking = await self.booking_repository.get_by_id(booking_id)
        if not old_booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        logger.info("booking_status_update_attempt", booking_id=booking_id, old_status=old_booking.status, new_status=new_status)
        if new_status not in [s.value for s in StatusApproval]:
            logger.warning("booking_status_update_failed_invalid_status", booking_id=booking_id, status=new_status)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Valid statuses are: {', '.join([s.value for s in StatusApproval])}")

        if StatusApproval(new_status) == StatusApproval.APPROVED and not force:
            conflicting_bookings = await self._get_conflicting_bookings(old_booking)
            if conflicting_bookings:
                conflict = conflicting_bookings[0]
                conflict_status = str(conflict.status).replace('-', ' ')
                conflict_time = f"{conflict.start_time.strftime('%H:%M')} - {conflict.end_time.strftime('%H:%M')}"
                logger.warning(
                    "booking_status_update_blocked_schedule_conflict",
                    booking_id=booking_id,
                    conflict_booking_id=conflict.id,
                    conflict_status=conflict.status,
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Tidak bisa menyetujui peminjaman karena bentrok jadwal dengan booking lain yang sudah {conflict_status} "
                        f"pada {conflict.date_of_booking.strftime('%Y-%m-%d')} pukul {conflict_time}."
                    ),
                )

        if force:
            logger.warning(
                "booking_force_override_used",
                booking_id=booking_id,
                new_status=new_status,
                validated_by=validated_by,
                reason=reason,
            )

        # Trigger handover if an APPROVED booking is canceled
        trigger_handover = (old_booking.status == StatusApproval.APPROVED.value and new_status == StatusApproval.CANCELED.value)

        update_data = {"status": StatusApproval(new_status).value}
        if reason is not None:
            update_data["reason"] = reason
        if validated_by is not None:
            update_data["validated_by"] = validated_by

        updated_booking = await self.booking_repository.update(old_booking.id, update_data)

        logger.info("booking_status_updated", booking_id=booking_id, new_status=new_status)
        if trigger_handover:
            canceled_booking_data = {
                "id": old_booking.id,
                "facility_id": old_booking.facility_id,
                "date_of_booking": old_booking.date_of_booking,
                "start_time": old_booking.start_time,
                "end_time": old_booking.end_time,
                "facility_name": old_booking.facility.name if old_booking.facility else "Unknown Facility"
            }
            logger.info("scheduling_handover_background_task", booking_id=booking_id)
            asyncio.create_task(self.handle_handover_to_next_in_queue(canceled_booking_data))

        return updated_booking

    async def _get_conflicting_bookings(self, booking: Booking):
        all_facility_bookings = await self.booking_repository.get_bookings_by_facility_id(booking.facility_id)
        booking_start = booking.start_time
        booking_end = booking.end_time
        booking_date = booking.date_of_booking.date()

        return [
            item for item in all_facility_bookings
            if item.id != booking.id
            and item.date_of_booking.date() == booking_date
            and item.status in {StatusApproval.APPROVED.value, StatusApproval.CHECKED_IN.value, 'ongoing'}
            and item.start_time < booking_end
            and item.end_time > booking_start
        ]

    async def handle_handover_to_next_in_queue(self, canceled_booking_data: dict):
        canceled_booking_id = canceled_booking_data["id"]
        facility_id = canceled_booking_data["facility_id"]
        logger.info("handover_triggered", canceled_booking_id=canceled_booking_id, facility_id=facility_id)
        
        async with AsyncSessionLocal() as db:
            # We must recreate repositories using the new db session
            from app.repositories.booking_repository import BookingRepository
            booking_repo = BookingRepository(db)
            
            # Get all bookings for this facility to find overlaps
            all_facility_bookings = await booking_repo.get_bookings_by_facility_id(facility_id)

            # Filter for PENDING bookings that overlap with the canceled booking
            overlapping_pending = [
                b for b in all_facility_bookings 
                if b.status == StatusApproval.PENDING.value
                and b.date_of_booking.date() == canceled_booking_data["date_of_booking"].date()
                and b.start_time < canceled_booking_data["end_time"] 
                and b.end_time > canceled_booking_data["start_time"]
            ]

            if not overlapping_pending:
                logger.info("handover_no_overlapping_pending", canceled_booking_id=canceled_booking_id)
                return

            # Sort by creation time (FIFO)
            overlapping_pending.sort(key=lambda x: x.created_at)

            next_booking = overlapping_pending[0]
            logger.info("handover_target_found", booking_id=next_booking.id, user_id=next_booking.user_id)

            # Generate handover token and expiration
            token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

            await booking_repo.update(next_booking.id, {
                "handover_token": token,
                "handover_expires_at": expires_at
            })

            # Send email
            confirmation_link = f"{settings.BASE_URL}/bookings/handover/confirm?token={token}"

            try:
                recipient_email = HARDCODE_MAIL_RECIPIENT.strip() if HARDCODE_MAIL_RECIPIENT.strip() else next_booking.user.email
                await self.mail_service.send_with_template(
                    recipients=[recipient_email],
                    subject="Booking Opportunity Available!",
                    template_name="handover_offer.html",
                    template_body={
                        "fullname": next_booking.user.fullname,
                        "facility_name": canceled_booking_data["facility_name"],
                        "date": next_booking.date_of_booking.strftime("%Y-%m-%d"),
                        "start_time": next_booking.start_time.strftime("%H:%M"),
                        "end_time": next_booking.end_time.strftime("%H:%M"),
                        "confirmation_link": confirmation_link
                    }
                )
            except Exception as e:
                logger.error("handover_email_sending_failed", error=str(e), booking_id=next_booking.id)

    async def accept_handover(self, token: str) -> Booking:
        # We need to manually handle this because we need to check token and expiration
        # and also load relationships for the response
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.booking import BookingItem

        stmt = select(Booking).where(
            Booking.handover_token == token,
            Booking.handover_expires_at > datetime.now(timezone.utc),
            Booking.status == StatusApproval.PENDING.value
        ).options(
            joinedload(Booking.extra_items).joinedload(BookingItem.item),
            joinedload(Booking.user),
            joinedload(Booking.facility)
        )

        result = await self.booking_repository.db.execute(stmt)
        booking = result.unique().scalar_one_or_none()

        if not booking:
            logger.warning("handover_acceptance_failed_invalid_token", token=token)
            raise HTTPException(status_code=400, detail="Invalid or expired handover token")

        # Accept the booking
        booking.status = StatusApproval.APPROVED.value
        booking.handover_token = None
        booking.handover_expires_at = None

        await self.booking_repository.db.commit()
        await self.booking_repository.db.refresh(booking)
        logger.info("handover_acceptance_successful", booking_id=booking.id, user_id=booking.user_id)
        return booking