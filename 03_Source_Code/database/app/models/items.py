from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.extraItems import ExtraItems

class Items(Base):
    __tablename__ = "items"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name : Mapped[str] = mapped_column(String, index=True, nullable=False)
    category : Mapped[str] = mapped_column(String, index=True, nullable=False)
    total_stock : Mapped[int] = mapped_column(Integer, default=0)
    available_stock : Mapped[int] = mapped_column(Integer, default=0)
    storeroom_location : Mapped[str] = mapped_column(String, nullable=True)
    condition : Mapped[str] = mapped_column(String, nullable=True)

    extra_item: Mapped["ExtraItems"] = relationship("ExtraItems", back_populates="item", uselist=False)