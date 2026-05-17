from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db
from app.repositories.booking_repository import BookingRepository
from app.repositories.facility_repository import FacilityRepository
from app.repositories.user_repository import UserRepository
from app.services.booking_service import BookingService
from app.schemas.booking import BookingResponse
from app.schemas.http import HTTPResponse
from app.api.dependencies import ensure_is_admin, get_current_user
from app.enums.user_enums import UserRoles
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.booking import Booking, BookingItem
from app.schemas.user import UserResponse
from app.storage.factory import get_document_storage
from app.services.mail_service import mail_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

async def get_booking_service(db: AsyncSession = Depends(get_db)):
    booking_repo = BookingRepository(db)
    facility_repo = FacilityRepository(db)
    user_repo = UserRepository(db)
    storage = get_document_storage()
    return BookingService(booking_repo, facility_repo, user_repo, storage, mail_service)

@router.get("/", response_model=HTTPResponse)
async def get_all_bookings(
    service: BookingService = Depends(get_booking_service),
    is_admin: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    bookings = await service.get_all_bookings()
    return HTTPResponse(
        success=True,
        data={"items": [BookingResponse.model_validate(b).model_dump(mode="json") for b in bookings]},
    )

@router.get("/my", response_model=HTTPResponse)
async def get_my_bookings(
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user)
) -> HTTPResponse:
    stmt = select(Booking).where(Booking.user_id == current_user.id).options(
        joinedload(Booking.extra_items).joinedload(BookingItem.item),
        joinedload(Booking.user),
        joinedload(Booking.facility)
    )
    result = await service.booking_repository.db.execute(stmt)
    bookings = result.unique().scalars().all()

    return HTTPResponse(
        success=True,
        data={"items": [BookingResponse.model_validate(b).model_dump(mode="json") for b in bookings]},
    )

@router.get("/facility/{facility_id}", response_model=HTTPResponse)
async def get_bookings_by_facility(
    facility_id: int,
    service: BookingService = Depends(get_booking_service)
) -> HTTPResponse:
    bookings = await service.get_facility_booking_queue(facility_id)
    return HTTPResponse(
        success=True,
        data={"items": [BookingResponse.model_validate(b).model_dump(mode="json") for b in bookings]}
    )

@router.get("/{booking_id}", response_model=HTTPResponse)
async def get_booking_by_id(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user),
) -> HTTPResponse:
    booking = await service.get_booking_by_id(booking_id)
    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(booking).model_dump(mode="json")},
    )

@router.post("/{facility_id}", response_model=HTTPResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    facility_id: int,
    purpose: str = Form(..., min_length=3),
    number_of_attendees: int = Form(..., ge=1),
    date_of_booking: str = Form(..., pattern=r"^\d{4}-\d{2}-\d{2}$"), # YYYY-MM-DD format
    start_time: str = Form(..., pattern=r"^\d{2}:\d{2}$"), # HH:MM format
    end_time: str = Form(..., pattern=r"^\d{2}:\d{2}$"), # HH:MM format
    fee: int | None = Form(None, ge=0),
    document: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    service: BookingService = Depends(get_booking_service),
) -> HTTPResponse:
    booking_date = datetime.strptime(date_of_booking, "%Y-%m-%d")
    start_dt = datetime.strptime(f"{date_of_booking} {start_time}", "%Y-%m-%d %H:%M")
    end_dt = datetime.strptime(f"{date_of_booking} {end_time}", "%Y-%m-%d %H:%M")

    booking = await service.create_booking(
        facility_id=facility_id,
        user_id=current_user.id,
        purpose=purpose,
        number_of_attendees=number_of_attendees,
        document=document,
        fee=fee,
        date_of_booking=booking_date,
        start_time=start_dt,
        end_time=end_dt
    )

    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(booking).model_dump(mode="json")},
    )

@router.put("/{booking_id}/status", response_model=HTTPResponse)
async def update_booking_status(
    booking_id: int,
    new_status: str = Form(..., pattern="^(pending|approved|rejected|canceled)$"),
    service: BookingService = Depends(get_booking_service),
    is_admin: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    updated_booking = await service.update_booking_status(booking_id, new_status)
    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(updated_booking).model_dump(mode="json")},
    )

@router.put("/{booking_id}/cancel", response_model=HTTPResponse)
async def cancel_booking(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user)
) -> HTTPResponse:
    booking_user_id = (await service.get_booking_by_id(booking_id)).user_id
    is_correct_user = booking_user_id == current_user.id    

    if not is_correct_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Kamu tidak memiliki izin untuk membatalkan booking ini")
    updated_booking = await service.update_booking_status(booking_id, "canceled")
    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(updated_booking).model_dump(mode="json")},
    )

@router.delete("/{booking_id}", response_model=HTTPResponse)
async def delete_booking(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    is_admin: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    await service.delete_booking(booking_id)
    return HTTPResponse(success=True, data={"message": "Booking deleted successfully"})

@router.get("/{booking_id}/document")
async def get_booking_document(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user),
):
    booking = await service.get_booking_by_id(booking_id)
    if not booking.document_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found for this booking")
    
    return RedirectResponse(url=booking.document_url)

@router.delete("/{booking_id}/document", response_model=HTTPResponse)
async def delete_booking_document(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user),
) -> HTTPResponse:
    success = await service.delete_booking_document(booking_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found or could not be deleted")
        
    return HTTPResponse(success=True, data={"message": "Document deleted successfully"})

@router.get("/handover/confirm", response_model=HTTPResponse)
async def confirm_handover(
    token: str,
    service: BookingService = Depends(get_booking_service)
) -> HTTPResponse:
    """
    Endpoint to confirm a booking handover using a token sent via email.
    """
    booking = await service.accept_handover(token)
    return HTTPResponse(
        success=True,
        data={}
    )
