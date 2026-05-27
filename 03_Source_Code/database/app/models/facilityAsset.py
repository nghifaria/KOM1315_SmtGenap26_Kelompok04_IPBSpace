from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from sqlalchemy import Integer


class FacilityAsset(Base):
    __tablename__ = "facility_assets"
    asset_id : Mapped[int] = mapped_column(Integer, ForeignKey("assets.id"), primary_key=True)
    facility_id : Mapped[int] = mapped_column(Integer, ForeignKey("facilities.id"), primary_key=True)
    asset = relationship("Asset", back_populates="asset_facilities")
    facility = relationship("Facility", back_populates="facility_assets")
