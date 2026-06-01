# KOM1315_SmtGenap26_Kelompok04_IPBSpace
| Nama | NIM |
| :--- | :--- |
| Naufal Ghifari Afdhala | G6401231029 |
| Samuel Christian | G6401231037 |
| Muhammad Farhadh | G6401231080 |

Repository ini adalah fork dari project [IPB Space](https://github.com/HusniAbdillah/ipb-space).
Bedanya di sini ada tambahan protokol keamanan untuk tugas pada mata kuliah KOM1315
---
 
# copy_stuff.py
 
Script ini dipakai untuk menyalin file-file _source code_ yang (mungkin) relevan dari folder backend ke struktur folder target (misal `03_Source_Code`).
 
## Cara pakai
 
Jalankan scriptnya:
 
```bash
python copy_stuff.py
```
 
Nanti akan minta dua input path:
 
- **SOURCE**: path ke folder `backend` project kamu
- **TARGET**: path ke folder `03_Source_Code` tujuan
Contoh input:
 
```
Input SOURCE backend folder path:
> C:\Users\ipb-space\backend
 
Input TARGET 03_Source_Code folder path:
> C:\Users\KOM1315_SmtGenap26_Kelompok04_IPBSpace\03_Source_Code
```
 
> Pakai path absolut supaya ga ribet tentang working directory.
 
## Kalau mau lebih gampang

Edit langsung dua variabel di bagian atas script biar ga perlu input manual tiap kali:
 
```python
SOURCE_ROOT = r"C:\Users\ipb-space\backend"
TARGET_ROOT = r"C:\Users\KOM1315_SmtGenap26_Kelompok04_IPBSpace\03_Source_Code"
```
Tapi mendingan duplicate scriptnya, misal jadi `copy_stuff_with_path.py` gitu, terus masukin ke `.gitginore` supaya ga ke push ke repo (yg `copy_stuff_with_path.py` udah ada di `.gitignore` nya btw)

Mapping lengkap file yang disalin bisa dilihat dan diubah di bagian `MAPPINGS` dalam script.
 
---

# 🏛️ IPB Space

<p align="center">
  <img src="frontend/src/assets/icons/logo.png" alt="IPB Space Logo" width="120" />
</p>

<p align="center">
  Campus facility booking and queue management system for IPB University.
</p>

<p align="center">
  <strong>Book Your Space, Set Your Pace, Make Your Place.</strong>
</p>

## Tech Stack

### Core Platform
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1020)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-HTTP-5A29E4?logo=axios&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-API-009688?logo=fastapi&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-ASGI-1F2937?logo=uvicorn&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white)
![Alembic](https://img.shields.io/badge/Alembic-Migrations-111827?logo=alembic&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-Validation-E92063?logo=pydantic&logoColor=white)
![Structlog](https://img.shields.io/badge/Structlog-Logging-334155)

## Core Features

- Public facility catalog and calendar for room availability visibility.
- Civitas booking workflow with date/time selection, supporting document upload, and booking history tracking.
- Digital ticket issuance for approved requests, including QR code support for operational validation.
- Facility Admin validation workspace for pending requests, queue context, and conflict visibility.
- Facility operations module for room management, schedule monitoring, and processed booking history.
- Super Admin control panel for user management and centralized master data (facilities, items, and assets).
- Role-based access control and role-aware routing across guest, civitas, facility admin, and super admin views.
- Audit and system log pages for booking lifecycle and operational activity monitoring.

## Role Model

| Role | Main Responsibilities |
| :--- | :--- |
| Civitas | Explore facilities, submit booking requests, track status, access ticket, and perform check-in in allowed window. |
| Facility Admin | Validate pending requests, manage facility operations, monitor schedule and booking history. |
| Super Admin | Manage users and master data (facilities, items, assets), monitor global calendar and system audit. |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js (LTS)
- PostgreSQL
- Git

### Setup

Clone the repository and follow the setup guides.

Backend setup (see [backend/README.md](backend/README.md)):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend setup (see [frontend/README.md](frontend/README.md)):

```bash
cd frontend
npm install
npm run dev
```

## Contributing

Contributions are welcome and reviewed through pull requests.

1. Create a feature branch:

   ```bash
   git checkout -b feat/your-feature-name
   ```

   Use prefixes:
   - `feat/` for new features
   - `fix/` for bug fixes
   - `docs/` for documentation changes

2. Commit and push:

   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin feat/your-feature-name
   ```

3. Submit a pull request with a clear description.
