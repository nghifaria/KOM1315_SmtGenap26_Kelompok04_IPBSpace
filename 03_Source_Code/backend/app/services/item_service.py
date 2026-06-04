from app.repositories.item_repository import ItemRepository
from app.repositories.extra_item_repository import ExtraItemRepository
from app.models.items import Items
from app.models.extraItems import ExtraItems
from app.schemas.item import ItemCreate, ItemUpdate, ExtraItemCreate

class ItemService:
    def __init__(self, item_repo: ItemRepository, extra_repo: ExtraItemRepository):
        self.item_repo = item_repo
        self.extra_repo = extra_repo

    # Item methods
    async def list_items(self):
        return await self.item_repo.get_all()

    async def get_item(self, item_id: int):
        return await self.item_repo.get_by_id(item_id)

    async def add_item(self, data: ItemCreate):
        new_item = Items(**data.model_dump())
        return await self.item_repo.create(new_item)

    async def update_item(self, item_id: int, data: ItemUpdate):
        return await self.item_repo.update(item_id, data.model_dump(exclude_unset=True))

    async def remove_item(self, item_id: int):
        # Note: Deleting an item might fail if it's referenced in extra_items (FK constraint)
        # We might want to handle that or let it raise an exception
        return await self.item_repo.delete(item_id)

    # Extra Item methods
    async def list_extra_items(self, start_time=None, end_time=None):
        extra_items = await self.extra_repo.get_all()
        if not start_time or not end_time:
            return extra_items

        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.booking import Booking
        from app.enums.status_approval import StatusApproval
        from datetime import datetime, timedelta, time

        target_date = start_time.date()
        day_start = datetime.combine(target_date - timedelta(days=1), time.min).replace(tzinfo=start_time.tzinfo)
        day_end = datetime.combine(target_date + timedelta(days=1), time.max).replace(tzinfo=end_time.tzinfo)

        stmt = select(Booking).where(
            Booking.status == StatusApproval.APPROVED.value,
            Booking.start_time >= day_start,
            Booking.start_time <= day_end
        ).options(joinedload(Booking.extra_items))

        res = await self.extra_repo.db.execute(stmt)
        bookings = res.unique().scalars().all()

        overlapping_bookings = []
        for b in bookings:
            blockout_end = b.end_time + timedelta(hours=2)
            if b.start_time < end_time and blockout_end > start_time:
                overlapping_bookings.append(b)

        reserved_counts = {}
        for b in overlapping_bookings:
            for bi in b.extra_items:
                reserved_counts[bi.item_id] = reserved_counts.get(bi.item_id, 0) + bi.quantity

        for ei in extra_items:
            if ei.item:
                reserved = reserved_counts.get(ei.item.id, 0)
                ei.item.available_stock = max(0, ei.item.total_stock - reserved)

        return extra_items

    async def get_extra_item(self, item_id: int):
        return await self.extra_repo.get_by_id(item_id)

    async def add_extra_item(self, data: ExtraItemCreate):
        # Check if item exists
        item = await self.item_repo.get_by_id(data.item_id)
        if not item:
            return None
        
        # Check if already an extra item
        existing = await self.extra_repo.get_by_id(data.item_id)
        if existing:
            return existing

        new_extra = ExtraItems(id_extraItem=data.item_id)
        return await self.extra_repo.create(new_extra)

    async def remove_extra_item(self, item_id: int):
        return await self.extra_repo.delete(item_id)
