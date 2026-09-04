# Design System & Visual Patterns: Toti Cakery Frontend

Dokumen ini mendokumentasikan spesifikasi design system, token warna, tipografi, komponen visual, dan pattern styling yang **benar-benar telah diimplementasikan** pada codebase frontend Toti Cakery.

> **Prinsip Dokumentasi**: Seluruh nilai, token, dan class yang tercantum di bawah ini diambil langsung dari hasil audit implementasi aktual pada komponen dan file konfigurasi frontend, bukan rancangan konsep atau usulan redesign. Bagian yang tidak didefinisikan secara eksplisit ditandai dengan *"Not explicitly defined / needs confirmation."*

---

## 1. Styling Technology & Configuration

### A. Teknologi Styling Aktual
- **Framework CSS**: **Tailwind CSS v3.4.1** (`tailwindcss: "3.4"` di `package.json`).
- **PostCSS**: `postcss: "^8.5.15"` dan `autoprefixer: "^10.5.0"`.
- **Icon Library**: **Lucide React v1.21.0** (`lucide-react`).
- **International Phone UI**: `react-international-phone: "^4.8.0"` (di-override via custom CSS class di `src/index.css`).
- **Class Utilities**: `clsx: "^2.1.1"` & `tailwind-merge: "^3.6.0"` terpasang di dependencies. Namun, helper terpusat (seperti `cn()`) belum dibuat; penggabungan class saat ini dilakukan via template literals atau `Array.join(' ')`.

### B. Konfigurasi `tailwind.config.js`
Konfigurasi Tailwind bersifat minimalis bawaan pabrik:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
*Catatan Penting*: Token tema kustom (seperti nama warna kustom atau fontFamily kustom) **tidak didaftarkan** pada `tailwind.config.js`. Seluruh warna khas Toti Cakery diimplementasikan menggunakan **Tailwind Arbitrary Values** (e.g. `bg-[#d85b30]`, `text-[#4b2417]`, `border-[#ead8ca]`).

### C. Global CSS (`src/index.css`)
Global stylesheet hanya memuat arahan dasar Tailwind dan penyesuaian styling khusus library pihak ketiga:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styling for react-international-phone to match Toti Cakery theme */
.react-international-phone-country-selector-button {
  border-top-left-radius: 0.75rem !important;
  border-bottom-left-radius: 0.75rem !important;
  border-right: 1px solid #ead8ca !important;
  background-color: #fffaf6 !important;
  height: 100% !important;
}

.react-international-phone-country-selector-button:hover {
  background-color: #fff1e9 !important;
}

.react-international-phone-country-selector-dropdown {
  border-radius: 0.75rem !important;
  border: 1px solid #ead8ca !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  z-index: 50 !important;
  background: white !important;
}

.react-international-phone-country-selector-dropdown__list-item:hover {
  background-color: #fff1e9 !important;
}

.react-international-phone-country-selector-dropdown__list-item--selected {
  background-color: #ffe6d8 !important;
  color: #d85b30 !important;
  font-weight: 600 !important;
}
```
- **CSS Variables**: *Not explicitly defined / needs confirmation.* (Tidak ada `:root` CSS variables di dalam codebase).

---

## 2. Color Palette (Aktual dari Codebase)

Aplikasi mengadopsi tema hangat *warm earthy & bakery palette* (perpaduan terakota, cokelat gelap espresso, krem hangat, serta aksen gold/amber dan hijau WhatsApp).

### A. Primary Brand Colors (Terracotta & Warm Rust)
| Hex Code | Frekuensi Audit | Peran & Penggunaan Aktual |
| :--- | :---: | :--- |
| `#d85b30` | 228 | **Brand Primary Accent**: Tombol utama, tab aktif, ring focus border, spinner loading, badge count, link penting, teks harga cart/checkout |
| `#c04e28` | 45 | **Primary Hover State**: Efek hover pada tombol utama (`hover:bg-[#c04e28]`) |
| `#c95b31` | 24 | **Focus & Link Hover**: Focus border input (`focus:border-[#c95b31]`), hover link navigasi |
| `#9b4a2f` | 9 | **Deep Terracotta**: Tombol beli katalog, badge kategori aktif di Catalog page |
| `#7e3a24` | 2 | **Deep Terracotta Hover**: Hover tombol di Catalog page |
| `#ef8b67` | 1 | Outline border tombol sekunder produk |
| `#f97316` | 3 | Aksen oranye aktif BuyerNavbar (`text-[#f97316]`, underline active indicator) |

### B. Dark Neutral & Typography Colors (Espresso & Chocolate)
| Hex Code | Frekuensi Audit | Peran & Penggunaan Aktual |
| :--- | :---: | :--- |
| `#4b2417` | 222 | **Primary Typography (Dark Chocolate)**: Headline h1-h4, judul produk, teks tebal, label formulir, angka metrik utama |
| `#3a1f16` | 17 | **Seller Dark Base (Deep Espresso)**: Background SellerSidebar (`bg-[#3A1F16]`), teks heading katalog |
| `#3f1f16` | 11 | Teks navigasi BuyerNavbar, border tombol auth navbar |
| `#6f5448` | 221 | **Secondary Typography (Warm Brown)**: Paragraf deskripsi, label input sekunder, sub-judul, teks tabel, navigasi footer |
| `#6b4a3c` | 6 | Deskripsi katalog, header kategori |
| `#8b7166` | 85 | **Muted Text & Icons**: Helper text formulir, ikon netral, timestamp riwayat pesanan, footer copyright |
| `#9c8478` | 24 | **Placeholder & Hints**: Placeholder input text, jumlah varian |

### C. Backgrounds & Surface Colors (Warm Creams & Neutrals)
| Hex Code | Frekuensi Audit | Peran & Penggunaan Aktual |
| :--- | :---: | :--- |
| `#fffaf5` | 5 | **Buyer Global Background**: Background utama wrapper `BuyerLayout.tsx` dan `App.tsx` fallback |
| `#fff7f0` / `#fff7f1` | 3 | Background auth page container & BuyerFooter (`bg-[#fff7f1]`) |
| `#fdf6f0` | 3 | Background gradient awal halaman Seller LoginPage |
| `#f4ebdf` | 5 | Background header `BuyerNavbar` (`bg-[#f4ebdf]/95 backdrop-blur`) & gradien akhir login |
| `#f8eee5` | 4 | Background hero section `HomePage.tsx` |
| `#f6efe6` | 5 | Background sidebar filter & card produk di `CatalogPage.tsx` |
| `#f8f4f0` | 5 | Background ringkasan pesanan di `CheckoutPage.tsx` & header item `OrdersPage.tsx` |
| `#f5eadf` | 2 | Background tab tombol tidak aktif di login buyer |
| `#fffaf6` | 6 | Background tombol negara pada `InternationalPhoneInput` |
| `#fff1e9` / `#fff1e7` | 12 | Hover item dropdown negara, tab aktif email/HP/WA, tombol panah carousel |
| `#fff4ed` | 5 | Hover state tombol batal/outline (`hover:bg-[#fff4ed]`) |
| `#ffe6d8` / `#ffe5d5` / `#ffe2cc` | 4 | Background lingkaran ikon benefit/keunggulan dan item selected dropdown |
| `#fbefe8` / `#efe4d6` | 2 | Background wadah gambar produk (image container) |
| `#ffffff` (`bg-white`) | Sangat Sering | Background kartu konten, modal, header seller, input field |
| `bg-gray-100` | Sering | Background dasar layout `SellerLayout.tsx` |

### D. Border & Divider Colors
| Hex Code | Frekuensi Audit | Peran & Penggunaan Aktual |
| :--- | :---: | :--- |
| `#ead8ca` | 44 | **Card & Component Border**: Border kartu auth, batas bawah BuyerNavbar, pembatas modal |
| `#d0bfaf` | 94 | **Input Border**: Border standar input teks, textarea, dropdown select, dan outline container |
| `#f0ded2` / `#f3e2d7` | 6 | Border pemisah footer, border kartu testimoni |
| `#e8dccb` | 6 | Hover background kategori katalog |
| `border-gray-200` | Sering | Border pemisah baris tabel seller, border seller header |

### E. Brand Accent, Functional & Status Colors
| Kategori / Kode | Token / Class | Penggunaan Aktual |
| :--- | :--- | :--- |
| **Seller Gold Accent** | `#e0a04e` | Background item aktif navigasi `SellerSidebar.tsx` (`bg-[#E0A04E] text-[#3A1F16]`), bintang rating katalog |
| **Review Star Gold** | `#ff8a00` | Warna isi bintang rating review (`fill-[#ff8a00] text-[#ff8a00]`) |
| **WhatsApp Green** | `#25d366`, `#1ebe57` | Floating Action Button `WhatsAppButton.tsx`, icon chat WA order seller |
| **Success** | `bg-green-50`, `text-green-600`, `text-green-700`, `bg-green-100` | Badge pesanan "Selesai", alert registrasi berhasil, badge "Aman" stok inventori |
| **Error / Danger** | `bg-red-50`, `text-red-500`, `text-red-600`, `border-red-400`, `bg-red-600` | Alert error autentikasi, validasi input merah, badge "Dibatalkan", badge stok habis |
| **Warning / Attention** | `bg-yellow-50`, `text-yellow-600`, `bg-yellow-100`, `text-yellow-700`, `bg-orange-100`, `text-orange-700` | Badge pesanan "Menunggu" / "Sedang Dibuat", badge stok "Menipis", badge produk "Diarsipkan" |
| **Info / Process** | `bg-blue-50`, `text-blue-600`, `bg-blue-100`, `bg-purple-50`, `text-purple-700` | Badge pesanan "Diproses", "Siap Dikirim", status order |

---

## 3. Typography & Fonts

### A. Font Family
- **Font Utama**: *Not explicitly defined in CSS/config / needs confirmation.*
- Tidak terdapat tag `@import url(...)` atau `<link>` Google Fonts di `index.html`.
- Menggunakan default Tailwind CSS system font stack:
  ```css
  ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
  ```

### B. Font Sizes & Weights
Codebase mengombinasikan ukuran teks standar Tailwind dengan bobot font yang sangat tegas:
- **`text-[9px]`**: Khusus badge angka keranjang belanja (`text-[9px] font-bold leading-none`).
- **`text-[10px]`**: Tag badge mini status produk (`text-[10px] font-bold` untuk "Stok Bahan Habis", "Min. X pcs").
- **`text-xs` (12px)**:
  - Label input form: `font-bold uppercase tracking-wider text-[#6f5448]`
  - Muted/helper text: `font-medium text-[#8b7166]`
  - Tag status, timestamp riwayat pesanan, header kolom tabel seller.
- **`text-sm` (14px)**:
  - Body text, nilai isian input, baris tabel, link menu navbar & sidebar, teks tombol biasa.
  - Weight: `font-medium` (500), `font-semibold` (600), atau `font-bold` (700).
- **`text-base` (16px)**:
  - Teks harga produk di card katalog (`font-black`), lead paragraph hero section.
- **`text-lg` (18px)**:
  - Judul modal kecil, subjudul section, angka ringkasan order status.
- **`text-xl` (20px)**:
  - Nilai pada dashboard metric cards (`font-black`), logo text navbar/sidebar.
- **`text-2xl` (24px)**:
  - Judul halaman (Page Title): `font-black text-[#4b2417]`.
  - Judul modal besar dan angka total checkout.
- **`text-3xl` (30px)**:
  - Angka metrik besar halaman pesanan seller & keuangan (`font-black text-[#4b2417]`).
  - Judul banner hero katalog produk.
- **`text-4xl` s/d `text-6xl` (36px - 60px)**:
  - Headline banner landing page `HomePage.tsx` (`text-4xl font-black md:text-5xl lg:text-6xl leading-tight`).

### C. Signature Typography Trait: `font-black`
Ciri khas visual terkuat frontend Toti Cakery adalah penggunaan class **`font-black` (bobot 900)** pada hampir semua judul halaman, nama produk, harga, tombol utama, dan logo branding (`TOTI`).

---

## 4. Spacing, Layout & Elevation

### A. Spacing & Container Hierarchy
| Tipe Container | Utility Class | Penggunaan Aktual |
| :--- | :--- | :--- |
| **Max Width Layar Lebar** | `max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12` | Header `BuyerNavbar.tsx` |
| **Storefront Container** | `max-w-7xl mx-auto px-4 lg:px-8` | `HomePage.tsx`, `CatalogPage.tsx` |
| **Account & Orders** | `max-w-5xl mx-auto px-4 py-8` | `OrdersPage.tsx`, `ProfilePage.tsx` |
| **Cart & Product Detail** | `max-w-4xl mx-auto px-4 py-8` / `py-12` | `CartPage.tsx`, `ProductDetailPage.tsx` |
| **Checkout Flow** | `max-w-2xl mx-auto px-4 py-8` | `CheckoutPage.tsx` |
| **Auth Card / Dialog** | `max-w-md` atau `max-w-lg` | Halaman login, register, modal pengguna, modal no HP |
| **Seller Layout Main Area** | `flex-1 p-6 overflow-y-auto` | Konten operasional dashboard seller |

### B. Border Radius Scale
- **`rounded` (4px)**: Tombol kuantitas (`+` / `-`), tombol aksi tabel kecil, tombol angka pagination.
- **`rounded-md` (6px)**: Tombol cart pada kartu produk, badge ringkas.
- **`rounded-lg` (8px)**: Dropdown select, tombol menu sidebar, container ringkasan pembayaran, tombol aksi umum.
- **`rounded-xl` (12px)**: Card standar dashboard, input field, kartu produk katalog, banner benefit, stat card, tombol primary/secondary checkout & auth.
- **`rounded-2xl` (16px)**: Kontainer utama form autentikasi (`max-w-md rounded-2xl`), modal dialog, floating toast notification.
- **`rounded-full` (9999px)**: Avatar inisial, search bar pill, badge status, badge notifikasi cart counter, FAB WhatsApp.

### C. Box Shadows (Elevation)
- **`shadow-sm`**: Standar untuk kartu metrik seller, card produk, header input, table container.
- **`shadow-md`**: Efek hover pada kartu produk katalog (`hover:-translate-y-1 hover:shadow-md`).
- **`shadow-lg`**: Dropdown menu bahasa, floating button WhatsApp (`shadow-lg hover:shadow-xl`).
- **`shadow-xl`**: Container modal dialog, kartu login seller (`shadow-xl backdrop-blur-sm`).
- **`shadow-2xl`**: Floating Toast notification di seller dashboard.

---

## 5. Komponen Form & UI Controls

### A. Input Fields
Codebase menerapkan dua variasi utama field input:

#### 1. Direct Input (Standar)
```tsx
<input
  type="text"
  placeholder="Masukkan nama"
  className="w-full rounded-xl border border-[#d0bfaf] bg-white/70 py-3 pl-4 pr-4 text-sm text-[#4b2417] outline-none transition placeholder:text-[#9c8478] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
/>
```

#### 2. Input Container dengan Focus-Within (Auth & Register)
```tsx
<div className="relative flex items-center rounded-xl border border-[#d0bfaf] bg-white transition-all focus-within:border-[#d85b30] focus-within:ring-2 focus-within:ring-[#d85b30]/20">
  <Mail className="ml-3.5 h-4 w-4 text-[#8b7166]" />
  <input
    type="email"
    className="w-full bg-transparent px-3 py-3 text-sm font-medium text-[#4b2417] placeholder:text-[#9c8478] outline-none"
  />
</div>
```

#### 3. Search Bar Pill (Buyer Navbar & Catalog)
```tsx
<div className="relative w-full max-w-[420px]">
  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f5448]" />
  <input
    type="text"
    placeholder="Cari dessert favorit kamu.."
    className="h-10 w-full rounded-full border border-[#6f5448]/45 bg-white/75 pl-11 pr-5 text-xs font-medium text-[#4b2417] outline-none placeholder:text-[#8b7166] focus:border-[#c95b31] focus:ring-2 focus:ring-[#e9b49d]/40"
  />
</div>
```

#### 4. International Phone Input (`PhoneInput.tsx`)
Komponen input nomor WhatsApp terstandarisasi dengan dropdown kode negara:
- Container: `rounded-xl border border-[#d0bfaf] bg-white` (merah jika `error`).
- Selector Flag: `!rounded-l-xl !bg-[#fffaf6] hover:!bg-[#fff1e9] !border-r !border-[#ead8ca]`.
- Dropdown: `!rounded-xl !border !border-[#ead8ca] !bg-white !shadow-xl`.

### B. Form Labels & Messages
- **Label Utama**: `mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f5448]`
- **Helper Text**: `mt-1.5 text-xs text-[#8b7166]`
- **Error Text**: `mt-1.5 text-xs font-medium text-red-500`

---

## 6. Buttons & Interactive Elements

### A. Primary Action Button
Digunakan untuk submit form autentikasi, konfirmasi pembayaran, checkout, dan aksi utama lainnya:
```tsx
<button
  type="submit"
  disabled={isLoading}
  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d85b30] text-sm font-black text-white transition hover:bg-[#c04e28] disabled:opacity-60"
>
  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan / Lanjut'}
</button>
```

### B. Secondary / Outline Button
Digunakan untuk tombol Batal pada modal atau aksi sekunder:
```tsx
<button
  type="button"
  onClick={onClose}
  className="rounded-xl border border-[#d0bfaf] px-5 py-2.5 text-sm font-bold text-[#4b2417] transition hover:bg-[#fff4ed]"
>
  Batal
</button>
```

### C. Compact Card Button (Tambah ke Keranjang)
Digunakan pada kartu produk di beranda dan katalog:
```tsx
<button
  type="button"
  disabled={!product.isAvailable}
  className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#9B4A2F] text-xs font-black text-white transition hover:bg-[#7E3A24] disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  <ShoppingCart className="h-3.5 w-3.5" />
  {product.isAvailable ? 'Tambah ke Keranjang' : 'Stok Bahan Habis'}
</button>
```

### D. Floating WhatsApp Button (`WhatsAppButton.tsx`)
Tombol melayang permanen di sudut kanan bawah untuk Buyer Portal:
```tsx
<a
  href={WHATSAPP_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#1EBE57] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
>
  <svg ... className="h-7 w-7" />
</a>
```

### E. Quantity Stepper
Tombol pengatur kuantitas barang:
```tsx
<div className="flex items-center gap-2">
  <button className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB] disabled:opacity-40">
    <Minus className="h-3 w-3" />
  </button>
  <span className="w-6 text-center text-sm font-semibold text-[#3A1F16]">{quantity}</span>
  <button className="flex h-7 w-7 items-center justify-center rounded border border-[#D0BFAF] text-[#3A1F16] hover:bg-[#E8DCCB] disabled:opacity-40">
    <Plus className="h-3 w-3" />
  </button>
</div>
```

---

## 7. Cards & Layout Containers

### A. Stat / Metric Card (Dashboard Seller & Orders)
Digunakan di dashboard seller, ringkasan pesanan, inventori, dan keuangan:
```tsx
<div className="rounded-xl bg-white p-5 shadow-sm">
  <div className="flex items-start justify-between">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
      <Icon className="h-5 w-5" />
    </div>
    <span className="text-xs font-semibold text-green-700">{change}</span>
  </div>
  <p className="mt-3 text-3xl font-black text-[#4b2417]">{value}</p>
  <p className="mt-1 text-sm text-[#6f5448]">{title}</p>
</div>
```

### B. Product Card (Katalog & Homepage)
```tsx
<article className="group overflow-hidden rounded-xl bg-[#F6EFE6] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
  <div className="relative aspect-square overflow-hidden bg-[#EFE4D6]">
    <img src={image} alt={name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#3A1F16] shadow-sm backdrop-blur">
      <Star className="h-3.5 w-3.5 fill-[#E0A04E] text-[#E0A04E]" />
      {rating} <span className="text-[#9C8478]">·</span> {sold} terjual
    </div>
  </div>
  <div className="p-4">
    <h3 className="line-clamp-1 text-sm font-black text-[#3A1F16]">{name}</h3>
    <p className="mt-0.5 text-xs font-medium text-[#6B4A3C]">{category}</p>
    <p className="mt-2 text-base font-black text-[#3A1F16]">Mulai {price}</p>
  </div>
</article>
```

### C. Content & Form Card Container
Untuk formulir autentikasi dan alur checkout:
```tsx
<div className="w-full max-w-md rounded-2xl border border-[#ead8ca] bg-white p-8 shadow-sm">
  <h1 className="text-2xl font-black text-[#4b2417]">{title}</h1>
  <p className="mt-1 text-sm text-[#6f5448]">{subtitle}</p>
  {/* form content */}
</div>
```

---

## 8. Tables & Data Presentation

Digunakan pada Seller Portal (Produk, Pesanan, Inventori, Keuangan, Chatbot FAQ, Pengaturan Pengguna):

```tsx
<div className="rounded-xl bg-white p-4 shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[850px] text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-xs font-bold uppercase text-[#6f5448]">
          <th className="py-3 pr-4">No</th>
          <th className="py-3 pr-4">Produk</th>
          <th className="py-3 pr-4">Harga</th>
          <th className="py-3 pr-4">Status</th>
          <th className="py-3 text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
          <td className="py-3 pr-4 text-[#6f5448]">1</td>
          <td className="py-3 pr-4 font-bold text-[#4b2417]">Kue Tart Cokelat</td>
          <td className="py-3 pr-4 font-semibold text-[#4b2417]">Rp 150.000</td>
          <td className="py-3 pr-4">
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              Aktif
            </span>
          </td>
          <td className="py-3 text-right">
            <div className="flex justify-end gap-1">
              <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100"><Eye className="h-4 w-4" /></button>
              <button className="rounded p-1 text-[#6f5448] hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Table Pagination Control
```tsx
<div className="mt-4 flex items-center justify-between text-sm text-[#6f5448]">
  <p>Menampilkan 1 - 5 dari 20 data</p>
  <div className="flex gap-1">
    <button className="rounded px-3 py-1 text-sm font-semibold bg-[#d85b30] text-white">1</button>
    <button className="rounded px-3 py-1 text-sm font-semibold bg-gray-200 text-[#6f5448] hover:bg-gray-300">2</button>
  </div>
</div>
```

---

## 9. Badges & Status Indicators

### A. Order Status Badges
| Status | Background & Text Classes | Icon | Tampilan Label |
| :--- | :--- | :---: | :--- |
| `pending` / `belum_dibayar` | `bg-yellow-50 text-yellow-600` atau `bg-gray-100 text-gray-700` | `<Clock />` | Menunggu / Belum Dibayar |
| `processed` / `sudah_dikonfirmasi` | `bg-blue-50 text-blue-600` atau `bg-blue-100 text-blue-700` | `<Package />` | Diproses / Sudah Dikonfirmasi |
| `sedang_dibuat` | `bg-yellow-100 text-yellow-700` | `<Clock />` | Sedang Dibuat |
| `shipped` / `siap_dikirim` | `bg-purple-50 text-purple-600` atau `bg-purple-100 text-purple-700` | `<Truck />` | Dikirim / Siap Dikirim |
| `completed` / `selesai` | `bg-green-50 text-green-600` atau `bg-green-100 text-green-700` | `<CheckCircle />` | Selesai |
| `cancelled` / `dibatalkan` | `bg-red-50 text-red-600` atau `bg-red-100 text-red-700` | `<XCircle />` | Dibatalkan |

*Shape*: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold`.

### B. Stock Inventory Badges
- **Aman**: `bg-green-100 text-green-700`
- **Menipis**: `bg-yellow-100 text-yellow-700`
- **Habis**: `bg-red-100 text-red-700`

### C. Cart Counter Badge
- Wadah lingkaran merah-terakota kecil pada ikon ShoppingCart:
  `absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d85b30] px-1 text-[9px] font-bold leading-none text-white`

---

## 10. Navigasi & Shell Layouts

### A. Buyer Portal Layout (`BuyerLayout.tsx`)
Menggunakan latar belakang krem lembut (`bg-[#fffaf5]`) dengan komponen navigasi dan footer permanen.

#### 1. Buyer Navbar (`BuyerNavbar.tsx`)
- **Struktur**: `sticky top-0 z-40 border-b border-[#ead8ca] bg-[#f4ebdf]/95 backdrop-blur h-[76px]`
- **Navigasi Links**:
  - Normal: `text-[#4b2417] text-sm font-semibold hover:text-[#f97316]`
  - Aktif: `text-[#f97316] after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#f97316]`
- **Language Switcher**: Dropdown bahasa ID / EN dengan flag emoji dan border `#ead8ca`.
- **User Avatar / Auth Trigger**:
  - Belum login: Tombol outline `border-[#3f1f16]/80 bg-white/45 px-4 text-xs font-semibold text-[#3f1f16]` ("Masuk / Daftar").
  - Sudah login: Avatar inisial `rounded-full bg-[#d85b30] text-xs font-bold text-white h-7 w-7` dan nama user.

#### 2. Buyer Footer (`BuyerFooter.tsx`)
- **Struktur**: `mt-10 border-t border-[#f0ded2] bg-[#fff7f1]`
- **Kolom Menu**: Tentang Kami, Bantuan, Kebijakan, Sosial Media (`h4: text-sm font-black text-[#4b2417]`, `links: text-xs text-[#6f5448] hover:text-[#d85b30]`).
- **Copyright**: `border-t border-[#ead8ca] text-xs text-[#8b7166] pt-5`.

---

### B. Seller Portal Layout (`SellerLayout.tsx`)
Menggunakan canvas admin warna netral `bg-gray-100` dengan sidebar gelap espresso di sisi kiri dan header putih di atas konten.

#### 1. Seller Sidebar (`SellerSidebar.tsx`)
- **Struktur**: `sticky top-0 flex h-screen w-64 flex-col overflow-y-auto bg-[#3A1F16]`
- **Header**: Logo toko + teks `TOTI` putih tebal (`text-xl font-black text-white`).
- **Navigasi Menu**:
  - Item Normal: `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white`
  - Item Aktif: `bg-[#E0A04E] text-[#3A1F16]` (Aksen emas kontras di atas dasar espresso).
- **User Profile Footer**:
  - Container: `border-t border-white/10 pt-4 bg-white/5 p-3 rounded-lg flex items-center gap-3`
  - Avatar Inisial: `h-10 w-10 rounded-full bg-[#E0A04E] text-[#3A1F16] font-black`
  - Informasi Role: `text-xs capitalize text-white/60`
  - Tombol Logout: `rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white`

#### 2. Seller Header (`SellerHeader.tsx`)
- **Struktur**: `flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4`
- **Sisi Kiri**: Greeting selamat datang `Halo, {user}! (text-2xl font-bold text-[#4b2417])` dan tanggal bahasa Indonesia (`text-sm text-[#6f5448]`).
- **Sisi Kanan**: Label role dan username/email login.

---

## 11. Modal, Dialog & Floating Overlays

### A. Modal Dialog
Digunakan pada Ubah No HP, Tambah/Edit Produk, Tambah Pesanan Manual, Tambah Inventori, Tambah FAQ, dan Tambah Pengguna.
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
    <div className="flex items-center justify-between border-b border-[#ead8ca] pb-3">
      <h3 className="text-lg font-black text-[#4b2417]">{title}</h3>
      <button onClick={onClose} className="rounded-full p-1 text-[#8b7166] hover:bg-gray-100">
        <X className="h-5 w-5" />
      </button>
    </div>
    <div className="mt-4">{children}</div>
    <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
      {/* Action buttons */}
    </div>
  </div>
</div>
```

### B. Floating Toast Notification (`SellerProductsPage.tsx`)
Notifikasi toast mengambang di pojok kanan bawah setelah mutasi data:
```tsx
<div className="fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-2xl border border-[#ead8ca] bg-white p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5">
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
    <CheckCircle className="h-5 w-5" />
  </div>
  <div className="flex-1 text-sm font-medium text-[#4b2417]">{toast.message}</div>
  <button onClick={() => setToast(null)} className="rounded-full p-1 text-[#8b7166] hover:bg-gray-100">
    <X className="h-4 w-4" />
  </button>
</div>
```

---

## 12. Feedback States: Loading, Error & Empty

### A. Loading State
1. **Global App Suspense Fallback (`App.tsx`)**:
   ```tsx
   <div className="flex min-h-screen items-center justify-center bg-[#fffaf5]">
     <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#d85b30]" />
   </div>
   ```
2. **Page Section Spinner (`HomePage`, `OrdersPage`, `SellerOrdersPage`)**:
   ```tsx
   <div className="flex h-64 items-center justify-center">
     <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
   </div>
   ```
3. **Button Spinner**: `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` pada tombol yang disable dengan `disabled:opacity-60`.
4. **Skeleton Placeholder (`CatalogPage.tsx`)**:
   ```tsx
   <div className="h-40 w-full animate-pulse rounded-xl bg-gray-200" />
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     <div className="h-80 animate-pulse rounded-xl bg-gray-100 p-4" />
   </div>
   ```

### B. Error State
1. **Inline Alert Box (Auth & Forms)**:
   ```tsx
   <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
     <AlertCircle className="h-4 w-4 shrink-0" />
     {error}
   </div>
   ```
2. **Full Page Error Box (`CatalogPage.tsx`)**:
   ```tsx
   <div className="mx-auto max-w-xl px-4 py-20 text-center">
     <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
       <p className="text-xl font-bold text-red-700">❌ Gagal Memuat Produk</p>
       <p className="mt-2 text-sm text-red-600">{error}</p>
       <button onClick={loadData} className="mt-5 inline-flex rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition">
         Coba Lagi
       </button>
     </div>
   </div>
   ```

### C. Empty State
1. **Empty Table Rows**:
   ```tsx
   <tr>
     <td colSpan={columnsCount} className="py-10 text-center text-sm text-[#6f5448]">
       Tidak ada data ditemukan.
     </td>
   </tr>
   ```
2. **Empty Card / State Container (`OrdersPage`, `CartPage`, `CatalogPage`)**:
   ```tsx
   <div className="mt-8 flex flex-col items-center justify-center rounded-xl bg-[#F6EFE6] py-16 text-center">
     <Package className="mx-auto h-12 w-12 text-gray-300" />
     <p className="mt-4 text-lg font-black text-[#3A1F16]">Belum ada pesanan</p>
     <p className="mt-2 text-sm text-[#6F5448]">Anda belum pernah membuat pesanan...</p>
     <Link to="/catalog" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d85b30] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c04e28]">
       Mulai Belanja
     </Link>
   </div>
   ```

---

## 13. Responsive Behaviour & Breakpoints

Aplikasi mengandalkan breakpoint default Tailwind CSS:
- `sm`: `640px`
- `md`: `768px`
- `lg`: `1024px`
- `xl`: `1280px`

### Implementasi Responsive Aktual:
1. **Buyer Navbar Responsive Collapse**:
   - Tampilan Desktop (`≥ md` / `≥ lg`): Menampilkan baris navigasi utama, input search bar tengah (`hidden lg:flex`), tombol language, dan trigger login.
   - Tampilan Mobile (`< md`): Seluruh menu desktop disembunyikan. Muncul tombol hamburger `Menu` (`md:hidden`). Ketika ditekan, menu accordion terbuka ke bawah menampilkan input search dan daftar menu vertikal.
2. **Catalog Category Filter Drawer**:
   - Desktop (`≥ md`): Tampil sebagai panel sidebar tetap di sisi kiri grid katalog (`w-[220px]`).
   - Mobile (`< md`): Berubah menjadi slide-over drawer (`fixed inset-y-0 left-0 z-50 w-[280px] -translate-x-full`) dengan backdrop gelap (`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm`), dibuka melalui tombol `MobileFilterToggle`.
3. **Data Tables di Seller Portal**:
   - Seluruh tabel seller dibungkus `<div className="overflow-x-auto">` dengan spesifikasi lebar minimum tabel `min-w-[850px]`, sehingga pada layar mobile atau tablet tabel tetap rapi dan dapat digeser horizontal tanpa merusak tata letak dashboard.
4. **Grid Responsif**:
   - Produk Katalog: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3`
   - Stat Cards Dashboard: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`
   - Testimoni Pelanggan: `grid gap-5 lg:grid-cols-3`

---

## 14. Unknown & Unconfirmed Items

Sesuai instruksi audit, berikut hal-hal yang **tidak dapat dipastikan** dari source code saat ini:
1. **Custom Web Fonts**: *Not explicitly defined / needs confirmation.* Codebase tidak memuat font eksternal (Google Fonts, Adobe Fonts, maupun `@font-face` lokal); styling mengandalkan sistem font default browser via Tailwind.
2. **CSS Custom Properties (Variables)**: *Not explicitly defined / needs confirmation.* Tidak ada token `:root { --primary: ... }` di file stylesheet.
3. **Komponen UI Terpusat (`src/components/ui`)**: *Directory is empty.* Belum ada library komponen atomik terisolasi (Button, Input, Card terpisah); komponen saat ini didefinisikan secara lokal di setiap file halaman atau modul terkait.
4. **Design Tokens di Tailwind Config**: *Not explicitly defined / needs confirmation.* Seluruh palet warna menggunakan arbitrary value class (e.g. `bg-[#d85b30]`), bukan token semantik (seperti `bg-primary`).
