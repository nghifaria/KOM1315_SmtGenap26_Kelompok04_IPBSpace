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
    async def list_extra_items(self):
        return await self.extra_repo.get_all()

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
