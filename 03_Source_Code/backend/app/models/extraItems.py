from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from sqlalchemy import Integer
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.items import Items

class ExtraItems(Base):
    __tablename__ = "extra_items"
    id_extraItem : Mapped[int] = mapped_column(Integer, ForeignKey("items.id"), primary_key=True)

    item: Mapped["Items"] = relationship("Items", back_populates="extra_item")