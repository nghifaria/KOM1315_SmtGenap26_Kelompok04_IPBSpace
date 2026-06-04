from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from app.models.booking import Booking, BookingItem

class BookingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        stmt = select(Booking).options(
            joinedload(Booking.extra_items).joinedload(BookingItem.item),
            joinedload(Booking.user),
            joinedload(Booking.facility)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().all()

    async def get_by_id(self, booking_id: int):
        stmt = select(Booking).where(Booking.id == booking_id).options(
            joinedload(Booking.extra_items).joinedload(BookingItem.item),
            joinedload(Booking.user),
            joinedload(Booking.facility)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().first()

    async def create(self, booking_data: Booking):
        self.db.add(booking_data)
        await self.db.commit()
        return await self.get_by_id(booking_data.id)

    async def delete(self, booking_id: int):
        booking = await self.get_by_id(booking_id)
        if booking:
            await self.db.delete(booking)
            await self.db.commit()
            return True
        return False

    async def update(self, booking_id: int, updated_data: dict):
        booking = await self.get_by_id(booking_id)
        if booking:
            for key, value in updated_data.items():
                setattr(booking, key, value)
            await self.db.commit()
            return await self.get_by_id(booking_id)
        return None

    async def get_bookings_by_facility_id(self, facility_id: int):
        stmt = select(Booking).where(Booking.facility_id == facility_id).options(
            joinedload(Booking.extra_items).joinedload(BookingItem.item),
            joinedload(Booking.user),
            joinedload(Booking.facility)
        )
        result = await self.db.execute(stmt)
        return result.unique().scalars().all()