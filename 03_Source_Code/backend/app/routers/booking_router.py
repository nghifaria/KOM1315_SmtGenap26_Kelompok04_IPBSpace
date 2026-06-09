from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.core.database import get_db
from app.repositories.booking_repository import BookingRepository
from app.repositories.facility_repository import FacilityRepository
from app.repositories.user_repository import UserRepository
from app.services.booking_service import BookingService
from app.schemas.booking import BookingResponse, BookingStatusUpdate
from app.schemas.http import HTTPResponse
from app.api.dependencies import ensure_is_admin, get_current_user, ensure_is_facility_manager, ensure_is_admin_or_facility_manager
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
    is_authorized: bool = Depends(ensure_is_admin_or_facility_manager)
) -> HTTPResponse:
    try:
        bookings = await service.get_all_bookings()
        return HTTPResponse(
            success=True,
            data={"items": [BookingResponse.model_validate(b).model_dump(mode="json") for b in bookings]},
        )
    except Exception as e:
        import structlog
        structlog.get_logger().error("get_all_bookings_failed", error=str(e))
        return HTTPResponse(
            success=True,
            data={"items": []},
        )

@router.get("/my", response_model=HTTPResponse)
async def get_my_bookings(
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user)
) -> HTTPResponse:
    try:
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
    except Exception as e:
        import structlog
        structlog.get_logger().error("get_my_bookings_failed", user_id=current_user.id, error=str(e))
        return HTTPResponse(
            success=True,
            data={"items": []},
        )

@router.get("/facility/{facility_id}", response_model=HTTPResponse)
async def get_bookings_by_facility(
    facility_id: int,
    service: BookingService = Depends(get_booking_service)
) -> HTTPResponse:
    try:
        bookings = await service.get_facility_booking_queue(facility_id)
        return HTTPResponse(
            success=True,
            data={"items": [BookingResponse.model_validate(b).model_dump(mode="json") for b in bookings]}
        )
    except Exception as e:
        import structlog
        structlog.get_logger().error("get_bookings_by_facility_failed", facility_id=facility_id, error=str(e))
        return HTTPResponse(
            success=True,
            data={"items": []}
        )

@router.get("/{booking_id}", response_model=HTTPResponse)
async def get_booking_by_id(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user),
) -> HTTPResponse:
    try:
        booking = await service.get_booking_by_id(booking_id)
        return HTTPResponse(
            success=True,
            data={"booking": BookingResponse.model_validate(booking).model_dump(mode="json")},
        )
    except Exception as e:
        import structlog
        structlog.get_logger().error("get_booking_by_id_failed", booking_id=booking_id, error=str(e))
        raise HTTPException(status_code=404, detail="Booking not found or connection error")

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
    extra_items: str | None = Form(None),
    current_user: UserResponse = Depends(get_current_user),
    service: BookingService = Depends(get_booking_service),
) -> HTTPResponse:
    from datetime import timezone, timedelta
    WIB = timezone(timedelta(hours=7))
    booking_date = datetime.strptime(date_of_booking, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    start_dt = datetime.strptime(f"{date_of_booking} {start_time}", "%Y-%m-%d %H:%M").replace(tzinfo=WIB)
    end_dt = datetime.strptime(f"{date_of_booking} {end_time}", "%Y-%m-%d %H:%M").replace(tzinfo=WIB)

    import json
    extra_items_list = None
    if extra_items:
        try:
            extra_items_list = json.loads(extra_items)
            if not isinstance(extra_items_list, list):
                raise HTTPException(status_code=400, detail="extra_items must be a JSON array")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid extra_items format. Must be JSON array.")

    booking = await service.create_booking(
        facility_id=facility_id,
        user_id=current_user.id,
        purpose=purpose,
        number_of_attendees=number_of_attendees,
        document=document,
        fee=fee,
        date_of_booking=booking_date,
        start_time=start_dt,
        end_time=end_dt,
        extra_items=extra_items_list
    )

    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(booking).model_dump(mode="json")},
    )

@router.put("/{booking_id}/status", response_model=HTTPResponse)
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user)
) -> HTTPResponse:
    if current_user.role not in [UserRoles.ADMIN.value, UserRoles.FACILITY_MANAGER.value, UserRoles.ADMIN.value]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if status_update.force and current_user.role != UserRoles.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Super Admin can force override bookings")

    updated_booking = await service.update_booking_status(
        booking_id, 
        status_update.new_status,
        status_update.reason,
        validated_by=current_user.fullname,
        force=status_update.force,
    )
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

@router.put("/{booking_id}/check-in", response_model=HTTPResponse)
async def check_in_booking(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    current_user: UserResponse = Depends(get_current_user),
) -> HTTPResponse:
    booking = await service.get_booking_by_id(booking_id)
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kamu tidak memiliki izin untuk check-in booking ini"
        )
    if booking.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking harus dalam status 'approved' untuk check-in"
        )
    updated_booking = await service.update_booking_status(booking_id, "checked-in")
    return HTTPResponse(
        success=True,
        data={"booking": BookingResponse.model_validate(updated_booking).model_dump(mode="json")},
    )

@router.delete("/{booking_id}", response_model=HTTPResponse)
async def delete_booking(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    _: bool = Depends(ensure_is_admin)
) -> HTTPResponse:
    await service.delete_booking(booking_id)
    return HTTPResponse(success=True, data={"message": "Booking deleted successfully"})

@router.get("/{booking_id}/document")
async def get_booking_document(
    booking_id: int,
    service: BookingService = Depends(get_booking_service),
    storage = Depends(get_document_storage),
    current_user: UserResponse = Depends(get_current_user),
):
    booking = await service.get_booking_by_id(booking_id)
    if not booking.document_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found for this booking")
    
    return await storage.read_booking_document(booking.document_url)

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
