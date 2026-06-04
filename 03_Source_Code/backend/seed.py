import asyncio
import random
from typing import TypedDict
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text

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
from app.models.booking import BookingItem

class SeedUser(TypedDict):
    fullname: str
    idnum: str
    email: str
    password: str
    role: UserRoles
    work_unit: str | None
    authority_code: str | None


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
    reason: str | None
    date_offset: int  # days from now
    start_hour: int
    end_hour: int
    extra_item_names: list[str] | None


SEED_USERS: list[SeedUser] = [
    {
        "fullname": "Budi Santoso",
        "idnum": "198001012005011001",
        "email": "admin@ipbspace.com",
        "password": "Admin1234",
        "role": UserRoles.ADMIN,
        "work_unit": None,
        "authority_code": "SA-IPB-001",
    },
    {
        "fullname": "Andi Wijaya",
        "idnum": "197505122002121002",
        "email": "manager@ipbspace.com",
        "password": "Manager1234",
        "role": UserRoles.FACILITY_MANAGER,
        "work_unit": "Direktorat Sarana dan Prasarana Utama",
        "authority_code": None,
    },
    {
        "fullname": "Retno Lestari",
        "idnum": "198311052008012003",
        "email": "manager2@ipbspace.com",
        "password": "Manager1234",
        "role": UserRoles.FACILITY_MANAGER,
        "work_unit": "Fakultas Kehutanan dan Lingkungan",
        "authority_code": None,
    },
    {
        "fullname": "Rian Ardianto",
        "idnum": "G64180001",
        "email": "civitas@ipbspace.com",
        "password": "Civitas1234",
        "role": UserRoles.CIVITAS,
        "work_unit": None,
        "authority_code": None,
    },
    {
        "fullname": "Ahmad Fauzi",
        "idnum": "J3D120099",
        "email": "mahasiswa1@ipbspace.com",
        "password": "User1234",
        "role": UserRoles.CIVITAS,
        "work_unit": None,
        "authority_code": None,
    },
    {
        "fullname": "Hermawan Prasetyo",
        "idnum": "197008151995121001",
        "email": "dosen1@ipbspace.com",
        "password": "User1234",
        "role": UserRoles.CIVITAS,
        "work_unit": None,
        "authority_code": None,
    },
    {
        "fullname": "Siti Aminah",
        "idnum": "198504232010012002",
        "email": "tendik1@ipbspace.com",
        "password": "User1234",
        "role": UserRoles.CIVITAS,
        "work_unit": None,
        "authority_code": None,
    },
]


SEED_FACILITIES: list[SeedFacility] = [
    {
        "name": "RK. U1.01",
        "code": "RK-U1-01",
        "location": "Gedung GWW Lantai 1",
        "capacity": 45,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Pak Budi (08123456789)",
        "assets": ["Proyektor LCD", "Papan Tulis Kaca", "Central Air Conditioner", "Stopkontak Colokan"],
    },
    {
        "name": "Lab Komputer A",
        "code": "LAB-KOM-A",
        "location": "Gedung CCR Lantai 2",
        "capacity": 30,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Bu Retno (08129876543)",
        "assets": ["Access Point High-Speed", "Central Air Conditioner", "Smart TV 65 Inci", "Stopkontak Colokan"],
    },
    {
        "name": "Aula Mini Fakultas",
        "code": "AULA-MINI-FEM",
        "location": "Gedung FEM Lantai 3",
        "capacity": 150,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Pak Junaidi (08134567890)",
        "assets": ["Sound System Ruangan", "Proyektor LCD", "Microphone Wireless", "Panggung Mini"],
    },
    {
        "name": "Ruang Rapat Senat",
        "code": "RUANG-RAPAT-SENAT",
        "location": "Gedung Rektorat Lantai 2",
        "capacity": 25,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Bu Mega (08112233445)",
        "assets": ["Smart TV 65 Inci", "Central Air Conditioner", "Sound System Ruangan", "Microphone Wireless", "Meja Dosen"],
    },
    {
        "name": "Auditorium GWW",
        "code": "AUDITORIUM-GWW",
        "location": "Gedung GWW Lantai Utama",
        "capacity": 1500,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
        "condition": "maintenance",
        "contact_person": "Pak Hendra (08122334455)",
        "assets": ["Sound System Ruangan", "Proyektor LCD", "Central Air Conditioner", "Panggung Mini"],
    },
    {
        "name": "Ruang Diskusi Perpustakaan",
        "code": "RUANG-DISKUSI-PERPUS",
        "location": "Gedung Perpustakaan Lantai 1",
        "capacity": 12,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Bu Ana (08223344556)",
        "assets": ["Access Point High-Speed", "Papan Tulis Kaca", "Stopkontak Colokan"],
    },
    {
        "name": "Gymnasium IPB",
        "code": "GYMNASIUM-IPB",
        "location": "Gymnasium Kampus Dramaga",
        "capacity": 2000,
        "threshold": 0,
        "image_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
        "condition": "good",
        "contact_person": "Pak Yudi (08334455667)",
        "assets": ["Sound System Ruangan", "Stopkontak Colokan"],
    },
]

SEED_ASSETS: list[SeedAsset] = [
    {"name": "Proyektor LCD"},
    {"name": "Papan Tulis Kaca"},
    {"name": "Central Air Conditioner"},
    {"name": "Sound System Ruangan"},
    {"name": "Smart TV 65 Inci"},
    {"name": "Access Point High-Speed"},
    {"name": "Microphone Wireless"},
    {"name": "Meja Dosen"},
    {"name": "Kursi Kuliah Lipat"},
    {"name": "Stopkontak Colokan"},
    {"name": "Panggung Mini"},
]

SEED_ITEMS: list[SeedItem] = [
    {
        "name": "Kursi Lipat Tambahan",
        "category": "Furniture",
        "total_stock": 300,
        "available_stock": 300,
        "storeroom_location": "Gudang Logistik Sarpra Utama",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Kabel Rol Perpanjangan",
        "category": "Electronics",
        "total_stock": 75,
        "available_stock": 75,
        "storeroom_location": "Gudang Peralatan Elektronik Rektorat",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Laser Pointer Presentasi",
        "category": "Electronics",
        "total_stock": 25,
        "available_stock": 25,
        "storeroom_location": "Gudang Alat Bantu Belajar CCR",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Speaker Portable",
        "category": "Audio",
        "total_stock": 15,
        "available_stock": 15,
        "storeroom_location": "Ruang Logistik Studio GWW",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Wireless Mic Tambahan",
        "category": "Audio",
        "total_stock": 20,
        "available_stock": 20,
        "storeroom_location": "Gudang Inventaris Audio-Visual",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Meja Lipat Tambahan",
        "category": "Furniture",
        "total_stock": 50,
        "available_stock": 50,
        "storeroom_location": "Gudang Logistik Sarpra Utama",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Standing Banner",
        "category": "Exhibition",
        "total_stock": 40,
        "available_stock": 40,
        "storeroom_location": "Gudang Logistik Sarpra Utama",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Modem WiFi Portable",
        "category": "Electronics",
        "total_stock": 10,
        "available_stock": 10,
        "storeroom_location": "Gudang IT Helpdesk Rektorat",
        "condition": "good",
        "is_extra": True,
    },
    {
        "name": "Spidol Boardmarker",
        "category": "Stationery",
        "total_stock": 150,
        "available_stock": 150,
        "storeroom_location": "Gudang ATK Pusat",
        "condition": "good",
        "is_extra": False,
    },
]

SEED_BOOKINGS: list[SeedBooking] = [
    {
        "facility_code": "RK-U1-01",
        "user_email": "civitas@ipbspace.com",
        "purpose": "Kuliah Pengantar Teknologi Pertanian",
        "number_of_attendees": 40,
        "document_url": "https://example.com/docs/surat_peminjaman_rk1.pdf",
        "status": StatusApproval.APPROVED.value,
        "reason": "Dokumen lengkap dan jadwal tersedia",
        "date_offset": 1,
        "start_hour": 8,
        "end_hour": 10,
        "extra_item_names": ["Kabel Rol Perpanjangan"],
    },
    {
        "facility_code": "LAB-KOM-A",
        "user_email": "mahasiswa1@ipbspace.com",
        "purpose": "Ujian Tengah Semester Lab Pemrograman",
        "number_of_attendees": 30,
        "document_url": "https://example.com/docs/uts_lab_pemrograman.pdf",
        "status": "checked-in",
        "reason": None,
        "date_offset": 0,
        "start_hour": 9,
        "end_hour": 12,
        "extra_item_names": ["Laser Pointer Presentasi"],
    },
    {
        "facility_code": "AULA-MINI-FEM",
        "user_email": "dosen1@ipbspace.com",
        "purpose": "Seminar Nasional Kewirausahaan Pemuda",
        "number_of_attendees": 120,
        "document_url": "https://example.com/docs/proposal_seminar_fem.pdf",
        "status": StatusApproval.PENDING.value,
        "reason": None,
        "date_offset": 3,
        "start_hour": 13,
        "end_hour": 16,
        "extra_item_names": ["Kursi Lipat Tambahan", "Speaker Portable"],
    },
    {
        "facility_code": "RUANG-RAPAT-SENAT",
        "user_email": "tendik1@ipbspace.com",
        "purpose": "Rapat Koordinasi Himpunan Mahasiswa Rektorat",
        "number_of_attendees": 20,
        "document_url": "https://example.com/docs/rapat_hima_rektorat.pdf",
        "status": StatusApproval.REJECTED.value,
        "reason": "Ruangan sedang digunakan untuk kegiatan senat universitas",
        "date_offset": -1,
        "start_hour": 14,
        "end_hour": 16,
        "extra_item_names": [],
    },
    {
        "facility_code": "RK-U1-01",
        "user_email": "mahasiswa1@ipbspace.com",
        "purpose": "Diskusi Kelompok Tugas Besar Pemrograman Web",
        "number_of_attendees": 6,
        "document_url": None,
        "status": StatusApproval.PENDING.value,
        "reason": None,
        "date_offset": 2,
        "start_hour": 14,
        "end_hour": 17,
        "extra_item_names": [],
    },
    {
        "facility_code": "RK-U1-01",
        "user_email": "mahasiswa1@ipbspace.com",
        "purpose": "Overlapping Booking 1 (Handover target 1)",
        "number_of_attendees": 10,
        "document_url": None,
        "status": StatusApproval.PENDING.value,
        "reason": None,
        "date_offset": 1,
        "start_hour": 8,
        "end_hour": 10,
        "extra_item_names": [],
    },
    {
        "facility_code": "RK-U1-01",
        "user_email": "dosen1@ipbspace.com",
        "purpose": "Overlapping Booking 2 (Handover target 2)",
        "number_of_attendees": 15,
        "document_url": None,
        "status": StatusApproval.PENDING.value,
        "reason": None,
        "date_offset": 1,
        "start_hour": 9,
        "end_hour": 11,
        "extra_item_names": [],
    },
]


async def truncate_tables() -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(text("TRUNCATE TABLE bookings, users, facilities, assets, items CASCADE;"))
        await session.commit()
    print("Database tables truncated successfully.")


async def seed_users() -> tuple[int, int]:
    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        for payload in SEED_USERS:

            query = select(User).where(
                User.email == payload["email"]
            )

            existing_user = (
                await session.execute(query)
            ).scalar_one_or_none()

            if existing_user:
                skipped += 1
                continue

            user = User(
                fullname=payload["fullname"],
                idnum=payload["idnum"],
                email=payload["email"],
                hashed_password=Security.hash_password(
                    payload["password"]
                ),

                role=payload["role"],

                work_unit=payload["work_unit"],
                authority_code=payload["authority_code"],
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
            WIB = timezone(timedelta(hours=7))
            booking_date = datetime.now(timezone.utc) + timedelta(days=payload["date_offset"])
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

            start_time = booking_date.replace(hour=payload["start_hour"], minute=0).replace(tzinfo=WIB)
            end_time = booking_date.replace(hour=payload["end_hour"], minute=0).replace(tzinfo=WIB)

            booking = Booking(
                facility_id=facility.id,
                user_id=user.id,
                purpose=payload["purpose"],
                number_of_attendees=payload["number_of_attendees"],
                document_url=payload["document_url"],
                status=payload["status"],
                reason=payload["reason"],
                date_of_booking=booking_date,
                start_time=start_time,
                end_time=end_time,
            )
            session.add(booking)
            await session.flush()

            # Add extra items
            if payload["extra_item_names"]:
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
    # Ensure database schema is migrated before seeding
    from app.core.database import engine
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS validated_by VARCHAR;"))
        print("Database migration check completed inside seed.py.")
    except Exception as e:
        print(f"Failed to migrate database inside seed.py: {e}")

    await truncate_tables()
    
    async def add_delay():
        delay = random.uniform(0.1, 0.5)
        print(f"Adding random delay of {delay:.2f} seconds...")
        await asyncio.sleep(delay)

    await add_delay()
    users_inserted, users_skipped = await seed_users()
    
    await add_delay()
    assets_inserted, assets_skipped = await seed_assets()
    
    await add_delay()
    facilities_inserted, facilities_skipped, fa_inserted = await seed_facilities()
    
    await add_delay()
    items_inserted, extra_inserted, items_skipped = await seed_items()
    
    await add_delay()
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
