"""
Integration Tests — Auth, Authorization, Cryptography, Session/JWT.

Berbeda dari test_security.py (unit test pakai mock), file ini:
  • Pakai PostgreSQL beneran (testuser:testpass@localhost/test_ipbspace)
  • Pakai httpx AsyncClient + ASGITransport — request HTTP nyata
    lewat router -> service -> repository -> DB
  • Satu event loop untuk seluruh session (asyncio_default_fixture_loop_scope=session)
  • Isolasi antar test via TRUNCATE setelah tiap test

Run:
    pytest tests/test_integration.py -v
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.models  # noqa: F401 — register semua model ke Base.metadata
from app.core.database import Base, get_db
from app.main import app

# --- Konstanta ----------------------------------------------------------------

TEST_DB_URL = "postgresql+asyncpg://postgres:password123@db:5432/test_ipb_space"

# Engine & session factory dibuat sekali, shared seluruh session pytest
# (aman karena satu event loop — asyncio_default_fixture_loop_scope=session)
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSession = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

# --- Setup / teardown tabel ---------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Buat semua tabel sebelum suite, drop sesudahnya."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


# --- Bersihkan data antar test ------------------------------------------------

# Urutan TRUNCATE memperhatikan FK: session -> user
_TRUNCATE_ORDER = ["user_sessions", "users"]

@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    """TRUNCATE semua tabel setelah tiap test supaya tidak ada data bocor."""
    yield
    async with test_engine.begin() as conn:
        for table in _TRUNCATE_ORDER:
            await conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))


# --- Override dependency get_db -> pakai test DB ------------------------------

@pytest_asyncio.fixture()
async def db_session():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture()
async def client(db_session: AsyncSession):
    """AsyncClient dengan get_db di-override ke test database."""
    async def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# --- Helper ------------------------------------------------------------------

async def register_user(
    client: AsyncClient,
    email: str,
    password: str = "Password123",
    role: str = "civitas",
) -> None:
    r = await client.post("/auth/register", json={
        "email": email,
        "fullname": "Integration Test User",
        "idnum": "INT001",
        "password": password,
        "role": role,
    })
    assert r.status_code == 201, f"Register gagal [{r.status_code}]: {r.text}"


async def login_user(
    client: AsyncClient,
    email: str,
    password: str = "Password123",
) -> dict:
    r = await client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login gagal [{r.status_code}]: {r.text}"
    return r.json()


async def register_and_login(
    client: AsyncClient,
    email: str,
    password: str = "Password123",
    role: str = "civitas",
) -> dict:
    await register_user(client, email, password, role)
    return await login_user(client, email, password)


# ===============================================================================
# Authentication — Integration
# ===============================================================================
class TestAuthIntegration:
    async def test_login_success(self, client: AsyncClient):
        """
        POST /auth/register -> POST /auth/login.
        Ekspektasi: 200, dapat access_token & refresh_token, data user benar.
        """
        await register_user(client, "login_ok@test.com")

        resp = await client.post("/auth/login", json={
            "email": "login_ok@test.com",
            "password": "Password123",
        })

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        token = body["data"]["token"]
        assert token["access_token"]
        assert token["refresh_token"]
        assert body["data"]["user"]["email"] == "login_ok@test.com"

    async def test_login_wrong_password(self, client: AsyncClient):
        """
        POST /auth/login dengan password salah.
        Ekspektasi: 401 Unauthorized.
        """
        await register_user(client, "wrong_pw@test.com")

        resp = await client.post("/auth/login", json={
            "email": "wrong_pw@test.com",
            "password": "SalahBanget99",
        })

        assert resp.status_code == 401

    async def test_account_locked_after_5_failed_attempts(self, client: AsyncClient):
        """
        5x POST /auth/login dengan password salah -> percobaan ke-6 kena 403.
        """
        email = "lockme@test.com"
        await register_user(client, email)

        for i in range(5):
            r = await client.post("/auth/login", json={
                "email": email, "password": "SalahPassword99"
            })
            assert r.status_code == 401, f"Attempt {i + 1} seharusnya 401"

        r = await client.post("/auth/login", json={
            "email": email, "password": "SalahPassword99"
        })
        assert r.status_code == 403
        # Custom exception handler: {"success": false, "data": {"error": {"message": "..."}}}
        assert "locked" in r.json()["data"]["error"]["message"].lower()


# ===============================================================================
# Authorization — Integration
# ===============================================================================

class TestAuthorizationIntegration:
    async def test_civitas_cannot_access_admin_endpoint(self, client: AsyncClient):
        """
        User role civitas -> GET /users/ (admin-only).
        Ekspektasi: 403 Forbidden.
        """
        body = await register_and_login(client, "civitas_noadmin@test.com", role="civitas")
        access_token = body["data"]["token"]["access_token"]

        resp = await client.get("/users/", headers={"Authorization": f"Bearer {access_token}"})
        assert resp.status_code == 403

    async def test_admin_can_access_admin_endpoint(self, client: AsyncClient):
        """
        User role admin -> GET /users/.
        Ekspektasi: 200 OK.
        """
        body = await register_and_login(client, "admin_user@test.com", role="admin")
        access_token = body["data"]["token"]["access_token"]

        resp = await client.get("/users/", headers={"Authorization": f"Bearer {access_token}"})
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    async def test_unauthenticated_request_rejected(self, client: AsyncClient):
        """Request tanpa token ke endpoint protected -> 401."""
        resp = await client.get("/users/me")
        assert resp.status_code == 401


# ===============================================================================
# Cryptography — Integration
# ===============================================================================

class TestCryptoIntegration:
    """Crypto layer end-to-end: sign+encrypt -> tulis disk -> baca -> verify+decrypt."""
    def _make_storage(self, tmp_path):
        from app.core.crypto import DocumentCrypto
        from app.storage.encrypted_document_storage import EncryptedDocumentStorage
        from app.storage.local_document_storage import LocalDocumentStorage

        crypto = DocumentCrypto()
        inner = LocalDocumentStorage(
            base_dir=str(tmp_path / "docs"),
            base_url="/uploads/docs",
        )
        return EncryptedDocumentStorage(inner, crypto=crypto, strict_verification=True), crypto

    async def _collect(self, iterator) -> bytes:
        return b"".join([chunk async for chunk in iterator])

    class _FakeUpload:
        def __init__(self, data: bytes, filename: str = "test.pdf"):
            self._data = data
            self.filename = filename
            self.content_type = "application/pdf"
        async def read(self, size=-1): return self._data
        async def close(self): pass

    async def test_encrypt_decrypt_round_trip(self, tmp_path):
        """Upload terenkripsi -> baca -> konten sama persis."""
        storage, _ = self._make_storage(tmp_path)
        original = b"%PDF-1.4 integration test document"

        url = await storage.upload_booking_document(self._FakeUpload(original))
        assert url.endswith(".secured")

        response = await storage.read_booking_document(url)
        assert await self._collect(response.body_iterator) == original

    async def test_signature_verification_valid(self, tmp_path):
        """Dokumen yang baru diupload harus lolos verifikasi signature."""
        storage, _ = self._make_storage(tmp_path)

        url = await storage.upload_booking_document(
            self._FakeUpload(b"%PDF-1.4 signed content")
        )
        response = await storage.read_booking_document(url)
        assert response.headers.get("X-Document-Signature-Valid") == "true"

    async def test_tampered_document_fails_verification(self, tmp_path):
        """File yang dikorupsi setelah upload harus raise Exception saat dibaca."""
        storage, _ = self._make_storage(tmp_path)

        url = await storage.upload_booking_document(
            self._FakeUpload(b"%PDF-1.4 tamper test")
        )

        # Korupsi byte di ujung file (AES-GCM auth tag / ciphertext)
        filename = url.split("/")[-1]
        filepath = tmp_path / "docs" / filename
        data = bytearray(filepath.read_bytes())
        data[-5] ^= 0xFF
        filepath.write_bytes(bytes(data))

        with pytest.raises(Exception):
            await storage.read_booking_document(url)


# ===============================================================================
# Session / JWT — Integration
# ===============================================================================

class TestSessionJWTIntegration:
    async def test_refresh_creates_new_access_token(self, client: AsyncClient):
        """
        POST /auth/refresh dengan refresh_token valid.
        Ekspektasi: 200, access_token baru yang berbeda dari yang lama.
        """
        body = await register_and_login(client, "refresh_user@test.com")
        old_access = body["data"]["token"]["access_token"]
        refresh_token = body["data"]["token"]["refresh_token"]

        resp = await client.post(f"/auth/refresh?refresh_token={refresh_token}")
        assert resp.status_code == 200

        new_access = resp.json()["data"]["token"]["access_token"]
        assert new_access, "access_token baru tidak boleh kosong"

        # Decode untuk verifikasi claim — token baru harus valid
        from app.core.security import Security
        payload = Security().decode_token(new_access)
        assert payload["sub"] == str(resp.json()["data"]["token"].get("user_id", payload["sub"]))
        assert payload["type"] == "access"

    async def test_logout_invalidates_refresh_token(self, client: AsyncClient):
        """
        POST /auth/logout -> POST /auth/refresh dengan token sama -> 401.
        """
        body = await register_and_login(client, "logout_user@test.com")
        access_token = body["data"]["token"]["access_token"]
        refresh_token = body["data"]["token"]["refresh_token"]

        logout = await client.post(
            "/auth/logout",
            json={"refresh_token": refresh_token},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert logout.status_code == 200

        refresh = await client.post(f"/auth/refresh?refresh_token={refresh_token}")
        assert refresh.status_code == 401

    async def test_invalid_access_token_rejected(self, client: AsyncClient):
        """Token palsu di Authorization header -> 401."""
        resp = await client.get(
            "/users/me",
            headers={"Authorization": "Bearer ini.token.palsu"},
        )
        assert resp.status_code == 401


# ===============================================================================
# User Security Audit — Integration
# ===============================================================================

class TestUserSecurityAuditIntegration:
    async def test_get_security_audit_success(self, client: AsyncClient):
        """
        GET /users/me/security-audit dengan token valid.
        Ekspektasi: 200 OK, memuat detail algoritma bcrypt, rounds 12, dan salt 22 karakter.
        """
        body = await register_and_login(client, "audit_ok@test.com")
        access_token = body["data"]["token"]["access_token"]

        resp = await client.get("/users/me/security-audit", headers={"Authorization": f"Bearer {access_token}"})
        assert resp.status_code == 200
        
        res_data = resp.json()
        assert res_data["success"] is True
        
        audit_data = res_data["data"]
        assert "bcrypt" in audit_data["algorithm"].lower()
        assert audit_data["rounds"] == 12
        assert len(audit_data["salt_b64"]) == 22
        assert audit_data["entropy_info"] == "128-bit CSPRNG Salt"

    async def test_get_security_audit_unauthenticated(self, client: AsyncClient):
        """GET /users/me/security-audit tanpa token -> 401."""
        resp = await client.get("/users/me/security-audit")
        assert resp.status_code == 401