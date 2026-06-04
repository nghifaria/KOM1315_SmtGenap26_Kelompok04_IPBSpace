# IPB Space - Backend Service

Layanan backend untuk IPB Space dibangun menggunakan FastAPI dengan arsitektur yang mendukung skalabilitas dan prinsip OOP yang ketat.

## Arsitektur Sistem (Clean Architecture)
Backend ini menerapkan pemisahan tugas (Separation of Concerns) yang ketat:

1.  **Router Layer (`/routers`):** Menangani HTTP Request dan Validasi Schema menggunakan Pydantic. **Dilarang keras** menempatkan logika bisnis di layer ini.
2.  **Service Layer (`/services`):** Menangani logika bisnis utama, seperti pengecekan bentrok jadwal, logika antrian, dan promosi status user.
3.  **Repository Layer (`/repositories`):** Menangani akses langsung ke database (operasi CRUD).

## Struktur Folder

```
backend/
├── alembic/                # (System) Folder untuk migrasi database otomatis
├── app/
│   ├── core/               # (Config) Konfigurasi utama & koneksi database
│   ├── models/             # (Database) Definisi Tabel (SQLAlchemy)
│   ├── schemas/            # (Validation) Validasi Data Input/Output (Pydantic)
│   ├── repositories/       # (Query) Akses ke Database (CRUD)
│   ├── services/           # (Logic) Logika Bisnis & Aturan Aplikasi
│   ├── routers/            # (API) Endpoint URL & Controller
│   └── main.py             # (Entry Point) Pintu masuk aplikasi FastAPI
├── requirements.txt        # Daftar library yang dipakai
└── alembic.ini             # File konfigurasi Alembic
```

## Konfigurasi Lingkungan (.env)
Copy file `.env.example` di `backend/`, rename jadi `.env`
jalankan 
```bash
cd backend
python scripts/generate_keys.py
```
Copy hasil `DOCUMENT_SIGNING_PRIVATE_KEY` dan `DOCUMENT_ENCRYPTION_KEY` ke `.env` tadi.

## Menjalankan dengan Docker Compose (Recommended)
1. **Pastikan Docker sudah ter-install di mesin anda**
```bash
docker --version # Memastikan docker sudah terinstall
```

2. **Pastikan sudah berada di Folder /backend**

3. **Jalankan container database**
```bash
docker compose up db -d
```

4. **Jalankan app backend dengan Docker Compose**
```bash
docker compose up --build -d
```

5. **Menghentikan Docker**
```bash
docker compose down -v # flag -v untuk menghapus data pada container postgres, jangan gunakan di prod
```

## Menjalankan dari Local

1. **Buat Virtual Environment**
```bash
python -m venv venv
```

2. **Aktifkan Virtual Environment**
* Windows: `venv\Scripts\activate`
* Linux/Mac: `source venv/bin/activate`

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Migrasi Database (Alembic)**
Wajib dijalankan setiap ada perubahan pada model database.
```bash
alembic upgrade head
```

5. **Seed Data Awal**
Jalankan perintah ini untuk menambahkan data awal user dan fasilitas (idempotent, aman dijalankan berulang):
```bash
python seed.py
```

Default akun yang dibuat:
- `admin@ipbspace.com` / `Admin1234`
- `manager@ipbspace.com` / `Manager1234`
- `civitas@ipbspace.com` / `Civitas1234`

6. **Jalankan Server**
```bash
uvicorn app.main:app --reload
```

7. **Dokumentasi API**
Akses Swagger UI di: `http://127.0.0.1:8000/docs`

---

## Dev Notes:
+ Rules for the password when registering a new user is: 
    - Cannot be empty
    - Must be at least 8 characters long
    - Must contain both letters and numbers
    - Cannot contain whitespace characters