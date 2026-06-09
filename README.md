# PRODUCTION DEPLOYMENT SUCCESSFUL (100% SECURED)

Sistem **IPB Space Security Hardening Framework** telah berhasil dideploy 100% secara aman pada infrastruktur cloud produksi:
🔗 **Live Demo Application:** https://kom-1315-smt-genap26-kelompok04-ipb.vercel.app/

### 🔑 Kredensial Akun Demo (Siap Pakai Sidang Live Demo)

| Peran / Role | Email / Username | Password | Cakupan Audit Proteksi |
| :--- | :--- | :--- | :--- |
| **User / Civitas** | `user1@ipbspace.com` | `User1234` | Enkripsi PDF Berkas & CSPRNG Salt Audit |
| **Facility Admin / Manager** | `manager@ipbspace.com` | `Manager1234` | Verifikasi Tanda Tangan Digital RSA-PSS |
| **Super Admin** | `admin@ipbspace.com` | `Admin1234` | Dashboard Analitik SOC & Emergency Account Recovery |

---

# KOM1315_SmtGenap26_Kelompok04_IPBSpace

| Nama Anggota Tim | NIM | Peran Utama |
| :--- | :--- | :--- |
| **Naufal Ghifari Afdhala** | G6401231029 | Project Manager & DevSecOps |
| **Samuel Christian** | G6401231037 | Lead Backend Engineer |
| **Muhammad Farhadh** | G6401231080 | Lead Frontend Engineer |

Repository ini adalah fork dari project [IPB Space](https://github.com/HusniAbdillah/ipb-space).
Perbedaan mendasar pada repositori ini adalah implementasi **Protokol Keamanan Hardening Berlapis** dan **Arsitektur Dashboard SOC** untuk memenuhi tugas Proyek Akhir PBL pada mata kuliah KOM1315 (Keamanan Informasi).

---
 
# 🛠️ Alat Bantu Pengembangan: copy_stuff.py
 
Script ini dipakai untuk menyalin file-file _source code_ yang relevan dari folder backend ke struktur folder target (misal `03_Source_Code`) secara terisolasi.
 
## Cara Pakai
Jalankan script menggunakan Python:
 
```bash
python copy_stuff.py

```

Sistem akan meminta dua masukan path absolut:

* **SOURCE**: Jalur folder `backend` proyek utama Anda
* **TARGET**: Jalur folder `03_Source_Code` tujuan pengiriman
Contoh input:

```
Input SOURCE backend folder path:
> C:\Users\ipb-space\backend
 
Input TARGET 03_Source_Code folder path:
> C:\Users\KOM1315_SmtGenap26_Kelompok04_IPBSpace\03_Source_Code

```

## Otomatisasi Variabel

Edit langsung dua variabel di bagian atas skrip untuk menghindari penginputan manual berulang kali:

```python
SOURCE_ROOT = r"C:\Users\ipb-space\backend"
TARGET_ROOT = r"C:\Users\KOM1315_SmtGenap26_Kelompok04_IPBSpace\03_Source_Code"

```

> **Catatan Keamanan:** Disarankan menyalin skrip ini menjadi `copy_stuff_with_path.py` (sudah terdaftar di dalam `.gitignore` agar parameter direktori lokal Anda tidak terekspos ke repositori publik).

---

# 🏛️ IPB Space Security Framework

## 🛡️ Security Hardening Tech Stack

### Cryptography & AAA Shields

* **Password Protection:** Hashing Bcrypt dengan Work Factor 12 Rounds ($2^{12}$ atau 4096 iterasi) + Generator Garam (*Salt*) Dinamis berbasis OS CSPRNG.
* **Session Framework:** Stateless Bearer JWT Token System dengan siklus hidup terkendali (Access Token 30 menit & Refresh Token 7 hari).
* **Data at Rest Shield:** Enkripsi berkas biner penuh menggunakan algoritma **AES-256-GCM** tingkat militer.
* **Digital Signature Protocol:** Implementasi skema asimetris probabilistik **RSASSA-PSS (RSA 2048-bit)** dikombinasikan dengan hashing **SHA-256**.
* **Data in Transit:** Enforced Transport Layer Security via **HTTPS / TLS 1.3**.

### Dashboard Operasional SOC

* **Pure SVG Charts:** Sistem diagram analitik makro siber murni menggunakan elemen asli `<rect>` dan `<path>` HTML5 (Bebas ketergantungan *library third-party*, menjamin 0% risiko *supply-chain vulnerability* pada React 19).
* **Asynchronous Telemetry:** Logging forensik mikro (IP Address, User-Agent, Request ID) didelegasikan secara non-blocking via *FastAPI Background Tasks*.

---

## 🌟 Core Features (Security Enhanced)

* **Public Catalog & Double Booking Protection:** Kalender dinamis real-time dilengkapi dengan dependensi pengecekan jadwal ketat di level repositori backend database.
* **Identity-Based Profiling & Entropy Playground:** Halaman profil civitas mengekstrak 22-karakter biner Salt kustom secara transparan dan menyediakan pengukur kekuatan kata sandi dinamis berbasis bit entropi.
* **Storage Security Vault & Ciphertext Downloader:** Manager dapat mengunduh berkas mentah terenkripsi biner (.secured) untuk membuktikan hancurnya keterbacaan data at rest jika database disusupi.
* **Digital Signature Audit Trail & Anti-Tampering Alarm:** Setiap dokumen PDF izin ditandatangani otomatis di server. Jika berkas dimanipulasi peretas di server, sistem memicu *Pulsing Integrity Alarm* merah menyala secara instan.
* **SOC Security Dashboard Panel:** Memantau metrik agregat siber (Total Enkripsi, Detektor Percobaan Akses Ilegal, Indikasi Serangan Massal/Brute Force).
* **Emergency Account Recovery:** Panel administrasi Super Admin kustom untuk memulihkan akun yang terblokir (*locked-out*) secara instan berbasis identitas parameter email (*reseed-proof*).
* **OWASP Top 10 Mitigation Matrix:** Panel kepatuhan khusus yang mendokumentasikan pembendangan SQL Injection (parameterized queries ORM) dan Cross-Site Scripting (React contextual auto-escaping).

---

## 👥 Role & Authorization Matrix

Sistem menegakkan Role-Based Access Control (RBAC) granular menggunakan dependensi *guards* FastAPI pada lapisan router API:

| Peran / Role | Hak Akses Utama & Tanggung Jawab Keamanan |
| --- | --- |
| **Civitas** | Akses katalog, submit booking, unggah PDF (Auto-encrypted), cek kekuatan entropi kata sandi, dan unduh tiket digital. |
| **Facility Admin / Manager** | Akses workspace peninjauan, otorisasi persetujuan berkas, penandatanganan dokumen asimetris, dan validasi digital signature. |
| **Super Admin** | Manajemen CRUD pengguna global, manajemen aset master data, kontrol Emergency Account Recovery, dan pengawasan dasbor analitik SOC. |

---

## 🚀 Quick Start (Production Environment Setup)

### Prerequisites

* Python 3.10+
* Node.js (LTS)
* PostgreSQL Relational Database
* Docker & Docker-Compose

### Cloud Production Access

Untuk menjalankan pengujian atau demo langsung tanpa instalasi lokal, gunakan gerbang tautan resmi kami:

* **Web Frontend Application:** https://kom-1315-smt-genap26-kelompok04-ipb.vercel.app/
* **Backend API Gateway URL:** https://kom1315smtgenap26kelompok04ipbspace-production.up.railway.app

---

## 🤝 Contributing & Deployment Code-Freeze

Proyek ini telah dikunci penuh (*CODE FREEZE STATUS*) dalam kondisi stabil, terkompilasi bersih tanpa *syntax error*, dan berhasil melewati **18/18 Kasus Uji Integrasi Backend (Green)** via Pytest di dalam klaster Docker kontainer.

`KOM1315 Keamanan Informasi | Departemen Ilmu Komputer | IPB University © 2026`
