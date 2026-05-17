import secrets
from datetime import datetime, timedelta
from typing import Sequence

from fastapi import HTTPException, UploadFile, status

from app.models.booking import Booking
from app.repositories.booking_repository import BookingRepository
from app.repositories.facility_repository import FacilityRepository
from app.repositories.user_repository import UserRepository
from app.storage.document_storage import DocumentStorage
from app.enums.status_approval import StatusApproval
from app.services.mail_service import MailService
from app.core.config import settings

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
    ) -> Booking:
        facility = await self.facility_repository.get_by_id(facility_id)
        if not facility:
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

        return await self.booking_repository.create(new_booking)
    
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

    async def update_booking_status(self, booking_id: int, new_status: str):
        old_booking = await self.booking_repository.get_by_id(booking_id)
        if not old_booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        if new_status not in [s.value for s in StatusApproval]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Valid statuses are: {', '.join([s.value for s in StatusApproval])}")

        # Trigger handover if an APPROVED booking is canceled
        trigger_handover = (old_booking.status == StatusApproval.APPROVED.value and new_status == StatusApproval.CANCELED.value)

        updated_booking = await self.booking_repository.update(old_booking.id, {"status": StatusApproval(new_status).value})

        if trigger_handover:
            await self.handle_handover_to_next_in_queue(old_booking)

        return updated_booking

    async def handle_handover_to_next_in_queue(self, canceled_booking: Booking):
        # Get all bookings for this facility to find overlaps
        all_facility_bookings = await self.booking_repository.get_bookings_by_facility_id(canceled_booking.facility_id)

        # Filter for PENDING bookings that overlap with the canceled booking
        overlapping_pending = [
            b for b in all_facility_bookings 
            if b.status == StatusApproval.PENDING.value
            and b.date_of_booking.date() == canceled_booking.date_of_booking.date()
            and b.start_time < canceled_booking.end_time 
            and b.end_time > canceled_booking.start_time
        ]

        if not overlapping_pending:
            return

        # Sort by creation time (FIFO)
        overlapping_pending.sort(key=lambda x: x.created_at)

        next_booking = overlapping_pending[0]

        # Generate handover token and expiration
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(minutes=30)

        await self.booking_repository.update(next_booking.id, {
            "handover_token": token,
            "handover_expires_at": expires_at
        })

        # Send email
        confirmation_link = f"{settings.BASE_URL}/bookings/handover/confirm?token={token}"

        await self.mail_service.send_with_template(
            recipients=[next_booking.user.email],
            subject="Booking Opportunity Available!",
            template_name="handover_offer.html",
            template_body={
                "fullname": next_booking.user.fullname,
                "facility_name": canceled_booking.facility.name,
                "date": next_booking.date_of_booking.strftime("%Y-%m-%d"),
                "start_time": next_booking.start_time.strftime("%H:%M"),
                "end_time": next_booking.end_time.strftime("%H:%M"),
                "confirmation_link": confirmation_link
            }
        )

    async def accept_handover(self, token: str) -> Booking:
        # We need to manually handle this because we need to check token and expiration
        # and also load relationships for the response
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.booking import BookingItem

        stmt = select(Booking).where(
            Booking.handover_token == token,
            Booking.handover_expires_at > datetime.now(),
            Booking.status == StatusApproval.PENDING.value
        ).options(
            joinedload(Booking.extra_items).joinedload(BookingItem.item),
            joinedload(Booking.user),
            joinedload(Booking.facility)
        )

        result = await self.booking_repository.db.execute(stmt)
        booking = result.unique().scalar_one_or_none()

        if not booking:
            raise HTTPException(status_code=400, detail="Invalid or expired handover token")

        # Accept the booking
        booking.status = StatusApproval.APPROVED.value
        booking.handover_token = None
        booking.handover_expires_at = None

        await self.booking_repository.db.commit()
        await self.booking_repository.db.refresh(booking)
        return booking