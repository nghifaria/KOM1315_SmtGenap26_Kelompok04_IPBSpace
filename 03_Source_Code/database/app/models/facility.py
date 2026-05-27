from sqlalchemy import Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from app.core.database import Base
from app.models.facilityAsset import FacilityAsset
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.asset import Asset

class Facility(Base):
    __tablename__ = "facilities"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name : Mapped[str] = mapped_column(String, index=True, nullable=False) # Contoh: "RK. U1.01"
    code : Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False) # Contoh: "RK-U1-01"
    location : Mapped[str] = mapped_column(String, nullable=False)         # Contoh: "Gedung GWW Lantai 2"
    capacity : Mapped[int] = mapped_column(Integer, default=0)
    threshold : Mapped[int] = mapped_column(Integer, default=0)        
    image_url : Mapped[str] = mapped_column(String, nullable=True)
    condition : Mapped[str] = mapped_column(String, nullable=True)
    contact_person : Mapped[str] = mapped_column(String, nullable=True)

    facility_assets : Mapped[list["FacilityAsset"]] = relationship("FacilityAsset", back_populates="facility", cascade="all, delete-orphan")
    assets: AssociationProxy[list["Asset"]] = association_proxy("facility_assets", "asset", creator=lambda asset: FacilityAsset(asset=asset))

    created_at : Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at : Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())