---
name: Institutional Modernism
colors:
  surface: '#f7fafe'
  surface-dim: '#d7dade'
  surface-bright: '#f7fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f8'
  surface-container: '#ebeef2'
  surface-container-high: '#e5e8ec'
  surface-container-highest: '#e0e3e7'
  on-surface: '#181c1f'
  on-surface-variant: '#444750'
  inverse-surface: '#2d3134'
  inverse-on-surface: '#eef1f5'
  outline: '#747781'
  outline-variant: '#c4c6d1'
  surface-tint: '#435d96'
  primary: '#001336'
  on-primary: '#ffffff'
  primary-container: '#02275d'
  on-primary-container: '#7690cc'
  inverse-primary: '#afc6ff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#221200'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d2400'
  on-tertiary-container: '#ca8100'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#afc6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#29457c'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7fafe'
  on-background: '#181c1f'
  surface-variant: '#e0e3e7'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
---

## Brand & Style

The design system is engineered to project authority, academic excellence, and administrative efficiency. It adopts a **Corporate Modern** style that balances the heritage of the institution with forward-thinking digital utility. 

The personality is formal yet accessible, prioritizing clarity over decoration. It utilizes a structured hierarchy to manage complex data sets, ensuring that the Super Admin experience feels controlled and deliberate. The visual language is defined by high-contrast primary elements against a soft, expansive background, evoking a sense of stable, high-tech infrastructure.

## Colors

This design system utilizes a palette anchored by **IPB Navy**, representing stability and institutional integrity. **Electric Cyan** serves as the primary action accent, providing a modern digital contrast.

- **Latar Belakang (#F4F7FB):** Digunakan untuk area workspace utama untuk mengurangi kelelahan mata.
- **Permukaan (#FFFFFF):** Digunakan untuk kartu, kontainer, dan elemen navigasi atas.
- **Warna Utama (#02275D):** Digunakan untuk sidebar, header teks penting, dan status primer.
- **Aksen (#06B6D4, #F59E0B):** Digunakan untuk indikator progres, notifikasi perhatian, dan elemen interaktif sekunder.
- **Bahaya (#EF4444):** Dicadangkan secara eksklusif untuk tindakan destruktif dan peringatan kritis.

## Typography

Sistem tipografi menggunakan **Inter** untuk memastikan keterbacaan maksimal pada data numerik dan teks administratif yang padat. Skala tipografi disusun untuk menciptakan hierarki informasi yang logis.

Gunakan `h1` untuk judul halaman utama dan `label-caps` untuk kategori pada navigasi sidebar. Seluruh instruksi dan teks antarmuka wajib menggunakan **Bahasa Indonesia Formal** (Baku) untuk menjaga profesionalitas institusi. Hindari penggunaan singkatan yang tidak standar dalam label input atau pesan eror.

## Layout & Spacing

Dashboard ini menggunakan **Fixed Grid** untuk area kerja utama dengan lebar maksimal yang terkendali, memastikan konten tidak meregang berlebihan pada layar ultra-wide.

- **Sidebar:** Tetap (Fixed) pada lebar 260px. Area ini memiliki latar belakang `Primary IPB Navy` dengan teks kontras tinggi.
- **Main Content:** Memiliki margin luar 32px untuk memberikan ruang napas bagi data.
- **Rhythm:** Menggunakan sistem 8px (base unit). Jarak antar kartu (gutter) ditetapkan sebesar 24px secara konsisten.

## Elevation & Depth

Kedalaman visual dicapai melalui teknik **Ambient Shadows** yang sangat halus. Alih-alih menggunakan bayangan hitam pekat, sistem ini menggunakan bayangan yang diberi warna dasar biru (`rgba(2,39,93, 0.05)`) untuk menyatu dengan identitas brand.

- **Layer 0 (Latar Belakang):** Flat #F4F7FB.
- **Layer 1 (Kartu & Surface):** Putih bersih dengan bayangan halus (Blur 15px, Y-Offset 4px).
- **Layer 2 (Dropdown & Modal):** Menggunakan bayangan yang sedikit lebih tegas untuk menunjukkan elevasi di atas elemen permukaan lainnya.

## Shapes

Bahasa bentuk dalam design system ini bersifat sistematis dan fungsional. Perbedaan radius digunakan untuk membedakan antara container struktural dan elemen interaktif.

- **Kartu Konten:** Menggunakan radius 12px untuk memberikan kesan modern dan ramah namun tetap profesional.
- **Elemen Interaktif:** Tombol, input field, dan dropdown menggunakan radius 8px yang lebih tajam untuk memberikan kesan presisi dan fungsionalitas teknis.

## Components

### Sidebar
Navigasi utama berada di sebelah kiri dengan lebar 260px. Status menu aktif harus ditandai dengan aksen `Electric Cyan` pada sisi kiri atau latar belakang yang sedikit lebih terang dari Navy.

### Buttons
- **Primary:** Latar belakang `Electric Cyan`, teks putih, radius 8px.
- **Secondary:** Border `IPB Navy`, latar transparan, teks `IPB Navy`.
- **Ghost:** Tanpa border, teks `IPB Navy`, digunakan untuk aksi yang kurang prioritas.

### Cards
Setiap modul informasi dibungkus dalam kartu putih dengan radius 12px dan bayangan `rgba(2,39,93, 0.05)`. Header kartu menggunakan `label-md` dengan garis pemisah tipis 1px.

### Form Inputs
Field input menggunakan border warna netral yang akan berubah menjadi `Electric Cyan` saat fokus. Label input diletakkan di atas field menggunakan `body-sm` dengan bobot `Semibold`.

### Status Chips
Gunakan chip kecil dengan radius 4px (Soft) untuk indikator status:
- **Sukses:** Background hijau pucat, teks hijau tua.
- **Peringatan:** Background `Amber` pucat, teks `Amber` tua.
- **Error:** Background `Danger Red` pucat, teks `Danger Red`.