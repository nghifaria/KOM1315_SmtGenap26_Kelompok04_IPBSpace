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
