
import datetime
from sqlalchemy import Integer
from app.core.database import Base
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from app.models.facilityAsset import FacilityAsset
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.facility import Facility

class Asset(Base):
    __tablename__ = "assets"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name : Mapped[str] = mapped_column(String, nullable=False)

    asset_facilities : Mapped[list[FacilityAsset]] = relationship("FacilityAsset", back_populates="asset", cascade="all, delete-orphan")
    facilities: AssociationProxy[list["Facility"]] = association_proxy("asset_facilities", "facility", creator=lambda facility: FacilityAsset(facility=facility))

    created_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.now, nullable=False)
    updated_at : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.now, onupdate=datetime.datetime.now, nullable=False)