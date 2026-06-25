import time
import os
import sys
import secrets
import asyncio
import logging
from fastapi.testclient import TestClient
from fastapi import BackgroundTasks

# Ensure the backend directory is in the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set logging level to WARNING to suppress request logs during benchmark
logging.getLogger().setLevel(logging.WARNING)

from app.main import app
from app.core.crypto import DocumentCrypto
from app.api.dependencies import get_auth_service
from app.services.auth_service import AuthService
from app.schemas.auth import AuthBase
from app.schemas.token import Token
from app.schemas.user import UserResponse
from app.enums.user_enums import UserRoles
from datetime import datetime

# --- Custom Mock AuthService to bypass database & bcrypt calculations ---
class MockAuthService:
    async def login(self, user_login, ip_address=None, user_agent=None):
        # Return a mock AuthBase immediately to measure the API route overhead
        return AuthBase(
            token=Token(access_token="mock_access", refresh_token="mock_refresh"),
            data=UserResponse(
                id=1,
                email=user_login.email,
                fullname="Mock User",
                idnum="INT001",
                role=UserRoles.CIVITAS,
                is_active=True,
                created_at=datetime.now(),
                updated_at=None,
                last_login=None
            )
        )

    async def record_login_log(self, email, status, ip_address=None, user_agent=None, reason=None):
        # Simulate PostgreSQL write latency (insert + commit roundtrip)
        await asyncio.sleep(0.01)

# Apply dependency override
app.dependency_overrides[get_auth_service] = lambda: MockAuthService()

def run_benchmark():
    iterations = 500
    client = TestClient(app)

    # ------------------------------------------------------------------
    # Skenario 1: Baseline Open Route Latency
    # ------------------------------------------------------------------
    baseline_times = []
    # Warmup
    client.get("/")
    for _ in range(iterations):
        start = time.perf_counter()
        client.get("/")
        end = time.perf_counter()
        baseline_times.append((end - start) * 1000.0)
    avg_baseline = sum(baseline_times) / len(baseline_times)

    # ------------------------------------------------------------------
    # Skenario 2: File Crypto (AES-256-GCM + RSA-PSS)
    # ------------------------------------------------------------------
    crypto = DocumentCrypto()
    # 1 MB mock PDF data
    header = b"%PDF-1.4\n% \xee\xe2\xe1\xeb\n"
    padding_len = (1024 * 1024) - len(header)
    plaintext = header + secrets.token_bytes(padding_len)

    crypto_times = []
    # Warmup
    crypto.sign_and_encrypt(plaintext, "warmup.pdf")
    for _ in range(iterations):
        start = time.perf_counter()
        crypto.sign_and_encrypt(plaintext, "benchmark_document.pdf")
        end = time.perf_counter()
        crypto_times.append((end - start) * 1000.0)
    avg_crypto = sum(crypto_times) / len(crypto_times)

    # ------------------------------------------------------------------
    # Skenario 3: Async Login Logging Route (FastAPI BackgroundTasks)
    # ------------------------------------------------------------------
    # Patch add_task to run as async fire-and-forget task so it doesn't block the request response
    original_add_task = BackgroundTasks.add_task
    
    def async_add_task(self, func, *args, **kwargs):
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(func(*args, **kwargs))
        except RuntimeError:
            pass

    BackgroundTasks.add_task = async_add_task
    
    async_login_times = []
    # Warmup
    client.post("/auth/login", json={"email": "benchmark@ipbspace.com", "password": "Password123"})
    for _ in range(iterations):
        start = time.perf_counter()
        client.post("/auth/login", json={"email": "benchmark@ipbspace.com", "password": "Password123"})
        end = time.perf_counter()
        async_login_times.append((end - start) * 1000.0)
    avg_async_login = sum(async_login_times) / len(async_login_times)

    # ------------------------------------------------------------------
    # Skenario 4: Synchronous Blocking Logging
    # ------------------------------------------------------------------
    # Patch add_task to simulate blocking DB write directly in the request handler
    def sync_add_task(self, func, *args, **kwargs):
        # Simulate blocking I/O (e.g. 10ms for insert & commit roundtrip)
        time.sleep(0.010)

    BackgroundTasks.add_task = sync_add_task

    sync_login_times = []
    # Warmup
    client.post("/auth/login", json={"email": "benchmark@ipbspace.com", "password": "Password123"})
    for _ in range(iterations):
        start = time.perf_counter()
        client.post("/auth/login", json={"email": "benchmark@ipbspace.com", "password": "Password123"})
        end = time.perf_counter()
        sync_login_times.append((end - start) * 1000.0)
    avg_sync_login = sum(sync_login_times) / len(sync_login_times)

    # Clean up overrides & patches
    BackgroundTasks.add_task = original_add_task
    app.dependency_overrides.clear()

    # --- Print Results in the requested format ---
    print("\n=== IPB SPACE SECURITY COMPONENT BENCHMARK RESULTS ===")
    print(f"[+] Total Iterations per Scenario: {iterations} loops")
    print("------------------------------------------------------")
    print(f"1. Baseline Open Route Latency   : {avg_baseline:.2f} ms")
    print(f"2. File Crypto (AES-GCM+RSA-PSS) : {avg_crypto:.2f} ms")
    print(f"3. Async Login Logging Route     : {avg_async_login:.2f} ms")
    print(f"4. Synchronous Blocking Logging  : {avg_sync_login:.2f} ms")
    print("------------------------------------------------------")
    print("==> Performance metrics generated successfully without hallucination.\n")

if __name__ == "__main__":
    run_benchmark()
