import asyncio
from typing import TypedDict
from datetime import datetime, timedelta

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import Security
from app.enums.user_enums import UserRoles
from app.models.asset import Asset
from app.models.facility import Facility
from app.models.user import User
from app.models.booking import Booking
from app.models.items import Items
from app.models.extraItems import ExtraItems
from app.models.facilityAsset import FacilityAsset
from app.enums.status_approval import StatusApproval


class SeedUser(TypedDict):
    fullname: str
    idnum: str
    email: str
    password: str
    role: str


class SeedFacility(TypedDict):
    name: str
    code: str
    location: str
    capacity: int
    threshold: int
    image_url: str | None
    condition: str | None
    contact_person: str | None
    assets: list[str] | None


class SeedAsset(TypedDict):
    name: str


class SeedItem(TypedDict):
    name: str
    category: str
    total_stock: int
    available_stock: int
    storeroom_location: str
    condition: str
    is_extra: bool


class SeedBooking(TypedDict):
    facility_code: str
    user_email: str
    purpose: str
    number_of_attendees: int
    document_url: str | None
    status: str
    date_offset: int  # days from now
    start_hour: int
    end_hour: int
    extra_item_names: list[str] | None


SEED_USERS: list[SeedUser] = [
    {
        "fullname": "Admin IPB Space",
        "idnum": "19880001",
        "email": "admin@ipbspace.com",
        "password": "Admin1234",
        "role": UserRoles.ADMIN.value,
    },
    {
        "fullname": "Facility Manager",
        "idnum": "19880002",
        "email": "manager@ipbspace.com",
        "password": "Manager1234",
        "role": UserRoles.FACILITY_MANAGER.value,
    },
    {
        "fullname": "Civitas Demo",
        "idnum": "20240001",
        "email": "civitas@ipbspace.com",
        "password": "Civitas1234",
        "role": UserRoles.CIVITAS.value,
    },
    {
        "fullname": "John Doe",
        "idnum": "20240002",
        "email": "user1@ipbspace.com",
        "password": "User1234",
        "role": UserRoles.CIVITAS.value,
    },
    {
        "fullname": "Jane Smith",
        "idnum": "20240003",
        "email": "user2@ipbspace.com",
        "password": "User1234",
        "role": UserRoles.CIVITAS.value,
    },
]


SEED_FACILITIES: list[SeedFacility] = [
    {
        "name": "RK. U1.01",
        "code": "RK-U1-01",
        "location": "Gedung GWW Lantai 1",
        "capacity": 40,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c",
        "condition": "good",
        "contact_person": None,
        "assets": ["Projector", "Whiteboard", "Air Conditioner"],
    },
    {
        "name": "Lab Komputer A",
        "code": "LAB-KOM-A",
        "location": "Gedung CCR Lantai 2",
        "capacity": 30,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
        "condition": "good",
        "contact_person": None,
        "assets": ["Air Conditioner", "Sound System"],
    },
    {
        "name": "Aula Mini Fakultas",
        "code": "AULA-MINI-FEM",
        "location": "Gedung FEM Lantai 3",
        "capacity": 120,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205",
        "condition": "good",
        "contact_person": None,
        "assets": ["Sound System", "Projector"],
    },
]

SEED_ASSETS: list[SeedAsset] = [
    {"name": "Projector"},
    {"name": "Whiteboard"},
    {"name": "Sound System"},
    {"name": "Air Conditioner"},
]

SEED_ITEMS: list[SeedItem] = [
    {
        "name": "Marker",
        "category": "Stationery",
        "total_stock": 50,
        "available_stock": 50,
        "storeroom_location": "Cabinet A",
        "condition": "new",
        "is_extra": False,
    },
    {
        "name": "Extension Cable",
        "category": "Electronics",
        "total_stock": 10,
        "available_stock": 10,
        "storeroom_location": "Cabinet B",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Folding Chair",
        "category": "Furniture",
        "total_stock": 100,
        "available_stock": 100,
        "storeroom_location": "Warehouse",
        "condition": "good",
        "is_extra": True,
    },
]


SEED_BOOKINGS: list[SeedBooking] = [
    {
        "facility_code": "RK-U1-01",
        "user_email": "civitas@ipbspace.com",
        "purpose": "Rapat Organisasi (Approved)",
        "number_of_attendees": 20,
        "document_url": "https://example.com/docs/booking1.pdf",
        "status": StatusApproval.APPROVED.value,
        "date_offset": 1,
        "start_hour": 10,
        "end_hour": 12,
        "extra_item_names": ["Extension Cable"],
    },
    {
        "facility_code": "RK-U1-01",
        "user_email": "user1@ipbspace.com",
        "purpose": "Diskusi Kelompok (Pending Overlap 1)",
        "number_of_attendees": 5,
        "document_url": "https://example.com/docs/booking4.pdf",
        "status": StatusApproval.PENDING.value,
        "date_offset": 1,
        "start_hour": 10,
        "end_hour": 11,
        "extra_item_names": [],
    },
    {
        "facility_code": "RK-U1-01",
        "user_email": "user2@ipbspace.com",
        "purpose": "Belajar Bareng (Pending Overlap 2)",
        "number_of_attendees": 4,
        "document_url": "https://example.com/docs/booking5.pdf",
        "status": StatusApproval.PENDING.value,
        "date_offset": 1,
        "start_hour": 11,
        "end_hour": 12,
        "extra_item_names": [],
    },
    {
        "facility_code": "LAB-KOM-A",
        "user_email": "civitas@ipbspace.com",
        "purpose": "Praktikum Mandiri",
        "number_of_attendees": 5,
        "document_url": "https://example.com/docs/booking2.pdf",
        "status": StatusApproval.APPROVED.value,
        "date_offset": 2,
        "start_hour": 13,
        "end_hour": 15,
        "extra_item_names": [],
    },
    {
        "facility_code": "AULA-MINI-FEM",
        "user_email": "civitas@ipbspace.com",
        "purpose": "Seminar Umum (No Document)",
        "number_of_attendees": 100,
        "document_url": None,
        "status": StatusApproval.PENDING.value,
        "date_offset": 3,
        "start_hour": 14,
        "end_hour": 16,
        "extra_item_names": ["Folding Chair", "Extension Cable"],
    },
]


async def seed_users() -> tuple[int, int]:
    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_USERS:
            query = select(User).where(User.email == payload["email"])
            existing_user = (await session.execute(query)).scalar_one_or_none()

            if existing_user:
                skipped += 1
                continue

            user = User(
                fullname=payload["fullname"],
                idnum=payload["idnum"],
                email=payload["email"],
                hashed_password=Security.hash_password(payload["password"]),
                role=payload["role"],
            )
            session.add(user)
            inserted += 1

        await session.commit()

    return inserted, skipped


async def seed_facilities() -> tuple[int, int, int]:
    inserted = 0
    skipped = 0
    fa_inserted = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_FACILITIES:
            query = select(Facility).where(Facility.code == payload["code"])
            existing_facility = (await session.execute(query)).scalar_one_or_none()

            if existing_facility:
                facility = existing_facility
                skipped += 1
            else:
                facility = Facility(
                    name=payload["name"],
                    code=payload["code"],
                    location=payload["location"],
                    capacity=payload["capacity"],
                    threshold=payload["threshold"],
                    image_url=payload["image_url"],
                    condition=payload["condition"],
                    contact_person=payload["contact_person"],
                )
                session.add(facility)
                await session.flush()
                inserted += 1

            # Associate assets
            if payload.get("assets"):
                for asset_name in payload["assets"]:
                    query_asset = select(Asset).where(Asset.name == asset_name)
                    asset = (await session.execute(query_asset)).scalar_one_or_none()
                    if asset:
                        # Check if association already exists
                        query_fa = select(FacilityAsset).where(
                            FacilityAsset.facility_id == facility.id,
                            FacilityAsset.asset_id == asset.id
                        )
                        existing_fa = (await session.execute(query_fa)).scalar_one_or_none()
                        if not existing_fa:
                            fa = FacilityAsset(facility_id=facility.id, asset_id=asset.id)
                            session.add(fa)
                            fa_inserted += 1

        await session.commit()

    return inserted, skipped, fa_inserted


async def seed_assets() -> tuple[int, int]:
    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_ASSETS:
            query = select(Asset).where(Asset.name == payload["name"])
            existing = (await session.execute(query)).scalar_one_or_none()

            if existing:
                skipped += 1
                continue

            asset = Asset(name=payload["name"])
            session.add(asset)
            inserted += 1

        await session.commit()

    return inserted, skipped


async def seed_items() -> tuple[int, int, int]:
    items_inserted = 0
    extra_inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_ITEMS:
            query = select(Items).where(Items.name == payload["name"])
            existing = (await session.execute(query)).scalar_one_or_none()

            if existing:
                skipped += 1
                continue

            item = Items(
                name=payload["name"],
                category=payload["category"],
                total_stock=payload["total_stock"],
                available_stock=payload["available_stock"],
                storeroom_location=payload["storeroom_location"],
                condition=payload["condition"],
            )
            session.add(item)
            await session.flush()

            if payload["is_extra"]:
                extra = ExtraItems(id_extraItem=item.id)
                session.add(extra)
                extra_inserted += 1

            items_inserted += 1

        await session.commit()

    return items_inserted, extra_inserted, skipped


async def seed_bookings() -> tuple[int, int]:
    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_BOOKINGS:
            # Get facility
            query_fac = select(Facility).where(Facility.code == payload["facility_code"])
            facility = (await session.execute(query_fac)).scalar_one_or_none()

            # Get user
            query_user = select(User).where(User.email == payload["user_email"])
            user = (await session.execute(query_user)).scalar_one_or_none()

            if not facility or not user:
                skipped += 1
                continue

            # Check if booking exists
            booking_date = datetime.now() + timedelta(days=payload["date_offset"])
            booking_date = booking_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            query_booking = select(Booking).where(
                Booking.facility_id == facility.id,
                Booking.user_id == user.id,
                Booking.purpose == payload["purpose"]
            )
            existing_booking = (await session.execute(query_booking)).scalar_one_or_none()

            if existing_booking:
                skipped += 1
                continue

            start_time = booking_date.replace(hour=payload["start_hour"], minute=0)
            end_time = booking_date.replace(hour=payload["end_hour"], minute=0)

            booking = Booking(
                facility_id=facility.id,
                user_id=user.id,
                purpose=payload["purpose"],
                number_of_attendees=payload["number_of_attendees"],
                document_url=payload["document_url"],
                status=payload["status"],
                date_of_booking=booking_date,
                start_time=start_time,
                end_time=end_time,
                updated_at=datetime.now(),
            )
            session.add(booking)
            await session.flush()

            # Add extra items
            if payload["extra_item_names"]:
                from app.models.booking import BookingItem
                for item_name in payload["extra_item_names"]:
                    query_item = select(Items).where(Items.name == item_name)
                    item = (await session.execute(query_item)).scalar_one_or_none()
                    if item:
                        bi = BookingItem(booking_id=booking.id, item_id=item.id, quantity=1)
                        session.add(bi)

            inserted += 1

        await session.commit()

    return inserted, skipped



async def main() -> None:
    users_inserted, users_skipped = await seed_users()
    assets_inserted, assets_skipped = await seed_assets()
    facilities_inserted, facilities_skipped, fa_inserted = await seed_facilities()
    items_inserted, extra_inserted, items_skipped = await seed_items()
    bookings_inserted, bookings_skipped = await seed_bookings()

    print("Seeding complete:")
    print(f"- users: inserted={users_inserted}, skipped={users_skipped}")
    print(f"- assets: inserted={assets_inserted}, skipped={assets_skipped}")
    print(f"- facilities: inserted={facilities_inserted}, skipped={facilities_skipped}")
    print(f"- facility_assets: inserted={fa_inserted}")
    print(f"- items: inserted={items_inserted}, extra={extra_inserted}, skipped={items_skipped}")
    print(f"- bookings: inserted={bookings_inserted}, skipped={bookings_skipped}")


if __name__ == "__main__":
    asyncio.run(main())

