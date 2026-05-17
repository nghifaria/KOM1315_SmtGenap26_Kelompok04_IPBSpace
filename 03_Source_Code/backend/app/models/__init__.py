"""
Import all models to ensure SQLAlchemy registry is populated on startup.
"""

from app.models.user import User, Civitas, FacilityAdmin, SuperAdmin
from app.models.facility import Facility
from app.models.asset import Asset
from app.models.facilityAsset import FacilityAsset
from app.models.booking import Booking, BookingItem
from app.models.schedule import Schedule
from app.models.session import UserSession
from app.models.items import Items
from app.models.extraItems import ExtraItems

__all__ = [
    "User",
    "Civitas",
    "FacilityAdmin", 
    "SuperAdmin",
    "Facility",
    "Asset",
    "FacilityAsset",
    "Booking",
    "BookingItem",
    "Schedule",
    "UserSession",
    "Items",
    "ExtraItems",
]
