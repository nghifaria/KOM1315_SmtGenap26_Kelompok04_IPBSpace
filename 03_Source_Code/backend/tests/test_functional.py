"""
Functional Tests — Auth Service & Session/JWT via PostgreSQL.

Menguji service layer langsung di atas PostgreSQL test DB.
Fokus: "apakah business logic berjalan benar?"
  • Pakai PostgreSQL beneran (test_ipb_space)
  • Tidak melalui HTTP layer — panggil AuthService langsung
  • Isolasi antar test via TRUNCATE setelah tiap test
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.security import Security
from app.enums.user_enums import UserRoles
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import FAILED_LOGIN_THRESHOLD, UserRepository
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import AuthService

# --- Konstanta ----------------------------------------------------------------

PLAIN_PASSWORD = "Password123"
ADMIN_EMAIL    = "admin@test.com"
CIVITAS_EMAIL  = "civitas@test.com"

TEST_DB_URL = "postgresql+asyncpg://postgres:password123@db:5432/test_ipb_space"

_security = Security()

# Urutan TRUNCATE memperhatikan FK: session -> user
_TRUNCATE_ORDER = ["user_sessions", "users"]


def _user_create(email: str, role: UserRoles = UserRoles.CIVITAS) -> UserCreate:
    return UserCreate(
        email=email,
        fullname="Test User",
        idnum="12345",
        password=PLAIN_PASSWORD,
        role=role,
    )


# --- Fixtures -----------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def engine():
    """PostgreSQL engine, shared seluruh session. Buat tabel sebelum suite, drop sesudahnya."""
    from app.core.database import Base
    import app.models  # populate SQLAlchemy registry

    _engine = create_async_engine(TEST_DB_URL, echo=False)

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield _engine

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_db(engine):
    """TRUNCATE semua tabel setelah tiap test supaya tidak ada data bocor."""
    yield
    async with engine.begin() as conn:
        for table in _TRUNCATE_ORDER:
            await conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))


@pytest_asyncio.fixture
async def db(engine) -> AsyncSession:
    """Satu AsyncSession per-test."""
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session


@pytest_asyncio.fixture
async def repos(db):
    """Tuple (user_repo, session_repo) yang sudah terhubung ke test DB."""
    return UserRepository(db), SessionRepository(db)


@pytest_asyncio.fixture
async def service(repos):
    user_repo, session_repo = repos
    return AuthService(user_repository=user_repo, session_repository=session_repo)


@pytest_asyncio.fixture
async def civitas_user(repos):
    """User CIVITAS yang sudah ada di DB."""
    user_repo, _ = repos
    return await user_repo.create(
        _user_create(CIVITAS_EMAIL, UserRoles.CIVITAS),
        _security.hash_password(PLAIN_PASSWORD),
    )


@pytest_asyncio.fixture
async def admin_user(repos):
    """User ADMIN yang sudah ada di DB."""
    user_repo, _ = repos
    return await user_repo.create(
        _user_create(ADMIN_EMAIL, UserRoles.ADMIN),
        _security.hash_password(PLAIN_PASSWORD),
    )


# ===============================================================================
# FUNCTIONAL TESTING
# ===============================================================================

class TestFunctional:

    # -- Authentication --------------------------------------------------------

    async def test_login_success(self, service, civitas_user):
        """Kredensial benar → dapat token pair + data user."""
        result = await service.login(
            UserLogin(email=CIVITAS_EMAIL, password=PLAIN_PASSWORD)
        )

        assert result.token.access_token
        assert result.token.refresh_token
        assert result.data.email == CIVITAS_EMAIL

        payload = _security.decode_token(result.token.access_token)
        assert payload["sub"] == str(civitas_user.id)
        assert payload["type"] == "access"

    async def test_login_wrong_password(self, service, civitas_user):
        """Password salah → HTTPException 401."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await service.login(
                UserLogin(email=CIVITAS_EMAIL, password="SalahBanget99")
            )
        assert exc.value.status_code == 401

    async def test_account_locked_after_5_failed_attempts(self, service, civitas_user):
        """
        5x salah password → akun terkunci.
        Percobaan ke-6 → 403 Forbidden.
        Data lock tersimpan di DB (bukan cuma di memori mock).
        """
        from fastapi import HTTPException

        # 5 percobaan gagal — masing-masing harus return None, bukan raise
        for i in range(FAILED_LOGIN_THRESHOLD):
            result = await service.authenticate(CIVITAS_EMAIL, "SalahBanget99")
            assert result is None, f"Attempt {i+1}: seharusnya None"

        # Ke-6: akun sudah terkunci → 403
        with pytest.raises(HTTPException) as exc:
            await service.authenticate(CIVITAS_EMAIL, "SalahBanget99")
        assert exc.value.status_code == 403
        assert "lock" in exc.value.detail.lower()

    # -- Session / JWT ---------------------------------------------------------

    async def test_refresh_returns_new_access_token(self, service, civitas_user):
        """Refresh token valid → access token baru, refresh token tidak berubah."""
        auth = await service.login(
            UserLogin(email=CIVITAS_EMAIL, password=PLAIN_PASSWORD)
        )
        old_refresh = auth.token.refresh_token

        result = await service.refresh_access_token(old_refresh)

        assert result.access_token
        assert result.refresh_token == old_refresh          # refresh tidak ganti

        payload = _security.decode_token(result.access_token)
        assert payload["type"] == "access"
        assert payload["sub"] == str(civitas_user.id)

    async def test_logout_invalidates_refresh_token(self, service, civitas_user):
        """Setelah logout, refresh token tidak bisa dipakai lagi → 401."""
        from fastapi import HTTPException

        auth = await service.login(
            UserLogin(email=CIVITAS_EMAIL, password=PLAIN_PASSWORD)
        )
        refresh_token = auth.token.refresh_token

        # Logout
        await service.logout(refresh_token)

        # Coba pakai refresh token bekas → harus ditolak
        with pytest.raises(HTTPException) as exc:
            await service.refresh_access_token(refresh_token)
        assert exc.value.status_code == 401
