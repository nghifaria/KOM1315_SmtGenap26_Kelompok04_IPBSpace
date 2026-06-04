# IPB Space - Frontend Client

Aplikasi klien berbasis web untuk IPB Space, dibangun menggunakan React.js dan Vite.

## Struktur Proyek
* `src/components`: Komponen UI yang dapat digunakan kembali (Button, Card, Input).
* `src/lib`: Konfigurasi utilitas, termasuk instance Axios.
* `src/pages`: Halaman-halaman utama aplikasi.
* `src/App.jsx`: Entry point dan konfigurasi routing.

## Integrasi API
Komunikasi dengan Backend dilakukan menggunakan library Axios yang telah dikonfigurasi di `src/lib/axios.js`.

**Ketentuan Pengembangan:**
* Jangan menggunakan `fetch` native. Gunakan instance axios yang telah disediakan.
* Pastikan URL backend pada konfigurasi axios sesuai dengan port backend yang berjalan (default: `http://127.0.0.1:8000`).

## Styling
Proyek ini menggunakan **Tailwind CSS**.
* Gunakan utility class untuk styling komponen.
* Hindari pembuatan file CSS kustom kecuali benar-benar diperlukan.

## Instalasi dan Eksekusi

1.  **Install Dependencies**
    Pastikan berada di direktori `frontend`.
    ```bash
    npm install
    ```

2.  **Jalankan Development Server**
    ```bash
    npm run dev
    ```

3.  **Build untuk Produksi**
    ```bash
    npm run build
    ```