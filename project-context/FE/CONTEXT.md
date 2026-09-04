# AI Context: Toti Cakery Frontend

Dokumen ini berisi konteks teknis, arsitektur, implementasi aktual, integrasi API, state management, RBAC, dan pedoman pengembangan untuk codebase frontend **Toti Cakery**.

> **Prinsip Dokumentasi**: Seluruh isi dokumen ini mencerminkan **kondisi aktual implementasi kode**, bukan arsitektur ideal atau rencana konseptual semata. Bagian yang belum terintegrasi atau belum ada endpoint-nya di backend ditandai secara eksplisit.

---

## 1. Project Overview

Frontend Toti Cakery adalah aplikasi web *Single-Page Application* (SPA) untuk sistem pemesanan kue dan manajemen operasional toko kue rumahan (Toti Cakery).

Aplikasi ini menyatukan dua portal utama dalam satu codebase React:
1. **Buyer Portal (Customer-Facing Storefront)**: Katalog produk, detail produk, keranjang belanja (*cart*), formulir checkout, pelacakan status pesanan, autentikasi pelanggan (login email, login no. WhatsApp & OTP, registrasi akun), serta profil pelanggan.
2. **Seller Portal (Admin & Staff Management)**: Dashboard metrik, manajemen katalog produk & Bill of Materials (BOM / Resep kue), kalkulasi HPP otomatis, manajemen stok bahan baku & kemasan (inventori), pengelolaan pesanan masuk, laporan keuangan, FAQ chatbot customer service, serta pengaturan pengguna internal.

---

## 2. Frontend Scope

### A. Buyer Portal Routes & Fitur
| Route Path | Komponen Halaman | Status Akses | Deskripsi Fitur Aktual |
| :--- | :--- | :--- | :--- |
| `/` (`ROUTES.HOME`) | `HomePage.tsx` | Publik | Landing page, banner hero, kategori populer, produk unggulan, review, FAQ ringkas, footer |
| `/catalog` (`ROUTES.CATALOG`) | `CatalogPage.tsx` | Publik | Daftar katalog produk aktif (`is_active = true`), pencarian nama/deskripsi, filter kategori |
| `/catalog/:slug` (`ROUTES.PRODUCT_DETAIL`) | `ProductDetailPage.tsx` | Publik | Detail produk berdasarkan slug/ID, seleksi varian awal, penambahan ke cart |
| `/cart` (`ROUTES.CART`) | `CartPage.tsx` | Publik | Daftar item belanja di cart, modifikasi kuantitas, subtotal, navigasi ke checkout |
| `/checkout` (`ROUTES.CHECKOUT`) | `CheckoutPage.tsx` | Protected Buyer | Alur checkout 3 tahap (form pengiriman, pembayaran, sukses). Proteksi dialihkan ke `/auth/buyer` jika belum login |
| `/orders` (`ROUTES.ORDERS`) | `OrdersPage.tsx` | Protected Buyer | Riwayat pesanan pembeli dengan filter status & pencarian. Proteksi dialihkan ke `/auth/buyer` |
| `/orders/:id` (`ROUTES.ORDER_DETAIL`) | `OrderDetailPage.tsx` | Protected Buyer | Detail rincian pesanan spesifik pembeli |
| `/profile` | `ProfilePage.tsx` | Protected Buyer | Profil buyer, ganti foto avatar lokal, ubah nomor WhatsApp via modal `PhoneInput`, reset password via OTP |
| `/auth/buyer` (`ROUTES.AUTH_BUYER`) | `BuyerLoginPage.tsx` | Publik | Login multi-mode (Email + password, Phone + password, Phone + WhatsApp OTP link), tab registrasi |
| `/auth/buyer/register` & `/register` | `Register.tsx` | Publik | Registrasi akun pembeli baru terintegrasi `InternationalPhoneInput` dan verifikasi WhatsApp |
| `/auth/buyer/forgot-password` | `BuyerForgotPasswordPage.tsx` | Publik | Reset kata sandi pembeli via verifikasi WhatsApp OTP |

### B. Seller Portal Routes & Fitur
| Route Path | Komponen Halaman | Status Akses / Role | Deskripsi Fitur Aktual |
| :--- | :--- | :--- | :--- |
| `/seller` | Redirect | Protected Seller | Dialihkan otomatis ke `/seller/dashboard` |
| `/seller/dashboard` (`ROUTES.SELLER_DASHBOARD`) | `SellerDashboardPage.tsx` | Owner, Admin, Staff | Ringkasan metrik pendapatan, pesanan, grafik penjualan, ringkasan stok |
| `/seller/products` (`ROUTES.SELLER_PRODUCTS`) | `SellerProductsPage.tsx` | Owner, Admin | CRUD produk lengkap, upload gambar produk, penetapan harga jual (`/price`), manajemen resep bahan (BOM) & audit HPP |
| `/seller/inventory` (`ROUTES.SELLER_INVENTORY`) | `SellerInventoryPage.tsx` | Owner, Admin, Staff | CRUD bahan baku & kemasan, update stok fisik, monitor peringatan stok menipis |
| `/seller/orders` (`ROUTES.SELLER_ORDERS`) | `SellerOrdersPage.tsx` | Owner, Admin, Staff | Manajemen pesanan masuk, pembuatan pesanan manual, update status pembayaran invoice |
| `/seller/reports` (`ROUTES.SELLER_REPORTS`) | `SellerFinancePage.tsx` | Owner Only | Laporan keuangan, analitik laba-rugi (P&L), ringkasan biaya operasional, export PDF simulasi |
| `/seller/chatbot` (`ROUTES.SELLER_CHATBOT`) | `SellerChatbotPage.tsx` | Owner, Admin | CRUD FAQ respon otomatis bot WhatsApp, filter status aktif/non-aktif |
| `/seller/settings` (`ROUTES.SELLER_SETTINGS`) | `SellerSettingsPage.tsx` | Owner Only | Profil toko, manajemen akun pengguna internal (Owner, Admin, Staff), kontrol hak akses |
| `/auth/seller` (`ROUTES.AUTH_SELLER`) | `SellerLoginPage.tsx` | Publik | Login internal (username & password) |
| `/auth/seller/forgot-password` | `SellerForgotPasswordPage.tsx` | Publik | Alur permintaan & verifikasi OTP reset password seller |

---

## 3. Buyer/Seller Context

Codebase memisahkan Buyer dan Seller secara tegas pada tingkat Layout dan UX:

1. **Buyer Context (`BuyerLayout.tsx`)**:
   - Skema warna bertema hangat/earthy (`bg-[#fffaf5]`).
   - Memuat `BuyerNavbar` (navigasi katalog, status login pembeli, indikator badge cart, toggle bahasa).
   - Memuat `BuyerFooter` (informasi jam buka toko, kontak alamat, media sosial).
   - Memuat `WhatsAppButton` mengambang di pojok kanan bawah yang terhubung ke nomor admin toko.
   - Proteksi rute buyer dilakukan secara individual di komponen halaman (`CheckoutPage`, `OrdersPage`, `ProfilePage`) dengan memeriksa `isAuthenticated && user?.role === 'buyer'`.

2. **Seller Context (`SellerLayout.tsx`)**:
   - Skema warna aplikasi admin (`bg-gray-100` dengan navigasi sidebar warna gelap espresso `#3A1F16` dan aksen gold/amber `#E0A04E`).
   - Memuat `SellerSidebar` (menu navigasi berdasarkan permission RBAC, profil user aktif, tombol logout).
   - Memuat `SellerHeader` (informasi halaman aktif & tanggal).
   - **Route Guard Terpusat**: Seluruh rute turunan di bawah `/seller` diproteksi langsung di level `SellerLayout`:
     ```typescript
     if (!isAuthenticated || !isSellerRole(user?.role)) {
       return <Navigate to={ROUTES.AUTH_SELLER} replace />
     }
     ```

---

## 4. Roles & RBAC (Role-Based Access Control)

### A. Tipe Role Aktual
Tipe data role didefinisikan di `src/types/index.ts`:
```typescript
export type BuyerRole = 'buyer'
export type SellerRole = 'owner' | 'admin' | 'staff'
export type UserRole = BuyerRole | SellerRole
```

Pemetaan level role dari backend (`role_level`):
- `role_level === 1` $\rightarrow$ `'owner'` (Owner / Superadmin)
- `role_level === 2` $\rightarrow$ `'admin'` (Admin)
- `role_level === 3` $\rightarrow$ `'staff'` (Staff)

### B. Matriks Hak Akses Internal (RBAC) Aktual
Dikelola di `src/services/rbacService.ts` dan disinkronkan ke `SellerSidebar.tsx`:

| Modul / Menu Seller | Permission Key | Owner (L1) | Admin (L2) | Staff (L3) |
| :--- | :--- | :---: | :---: | :---: |
| **Dashboard** (`/seller/dashboard`) | `view_dashboard` | ✅ | ✅ | ✅ |
| **Pesanan** (`/seller/orders`) | `view_process_orders` | ✅ | ✅ | ✅ |
| **Produk & Resep** (`/seller/products`) | `manage_products` | ✅ | ✅ | ❌ |
| **Stok / Inventori** (`/seller/inventory`) | `manage_inventory` | ✅ | ✅ | ✅ |
| **Laporan Keuangan** (`/seller/reports`) | `view_financial_reports` | ✅ | ❌ | ❌ |
| **Chatbot FAQ** (`/seller/chatbot`) | `manage_chatbot_faq` | ✅ | ✅ | ❌ |
| **Pengaturan & Users** (`/seller/settings`) | `manage_users` | ✅ | ❌ | ❌ |

> **Catatan Kondisi Aktual**: Daftar permission di atas saat ini didefinisikan secara statis di FE (`rolePermissionMap` di `src/services/rbacService.ts`). Belum ada endpoint backend khusus untuk konfigurasi dinamis permission per user.

---

## 5. Tech Stack

| Kategori | Teknologi / Library | Versi Aktual | Keterangan Penggunaan |
| :--- | :--- | :--- | :--- |
| **Runtime & Framework** | React | `18.3` | UI Core Library (`react`, `react-dom`) |
| **Build Tool & Bundler** | Vite | `^5.3.4` | Fast HMR, ESM build pipeline (`@vitejs/plugin-react`) |
| **Language** | TypeScript | `5.9.3` | Strict type checking (`tsconfig.app.json` dengan `"strict": true`) |
| **Routing** | React Router DOM | `^6.30.4` | Client-side routing dengan `createBrowserRouter` & `RouterProvider`, `React.lazy` + `Suspense` |
| **HTTP Client** | Axios | `^1.18.1` | REST client dengan global interceptors (`src/api/client.ts`) |
| **Styling** | Tailwind CSS | `3.4` | Utilitas styling CSS dengan PostCSS & Autoprefixer |
| **Styling Utilities** | `clsx` & `tailwind-merge` | `^2.1.1` / `^3.6.0` | Helper penggabungan kelas Tailwind dinamis |
| **Icons** | Lucide React | `^1.21.0` | Set icon SVG seragam di seluruh halaman |
| **Localization (i18n)** | `i18next` & `react-i18next`| `^23.16.8` / `^15.7.4` | Framework multi-bahasa (`id` dan `en`) |
| **Phone Input** | `react-international-phone` | `^4.8.0` | Input nomor telepon berstandar E.164 dengan dropdown bendera |
| **Deployment / Web Server** | Nginx on Docker | Multi-stage build | `Dockerfile` (`node:20-alpine` build $\rightarrow$ `nginx:alpine` runtime), `nginx.conf` untuk reverse proxy `/api/` dan SPA fallback |

---

## 6. FE ↔ BE Relationship

### A. Endpoint & Environment Configuration
Konfigurasi Base URL API di frontend memiliki 2 mekanisme:
1. **Direct Base URL (`src/api/client.ts`)**:
   ```typescript
   export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
   ```
   Nilai di `.env` lokal: `VITE_API_BASE_URL=https://backend-cakery.vercel.app`.
2. **Reverse Proxy Configuration**:
   - Pada pengembangan lokal Vite (`vite.config.ts`), rute `/api` di-proxy ke `http://localhost:8000`.
   - Pada produksi container Nginx (`nginx.conf`), rute `/api/` di-proxy ke upstream container `backend:8000` dengan rewrite `^/api/(.*)$ /$1 break;`.
   - Di `src/constants/index.ts`, terdapat konstanta `API_BASE_URL = '/api'`.

### B. Format Gambar Produk (Image URL Contract)
- **Dari Backend**: Backend FastAPI mengembalikan path relatif internal, contoh: `"/static/products/12.jpg"`.
- **Di Frontend (`src/services/productService.ts`)**: Fungsi `resolveImageUrl()` memetakan path relatif tersebut menjadi URL absolut yang valid untuk browser (`${API_BASE_URL}/static/products/12.jpg`) dan menyematkan parameter cache buster `?v=${updated_at}` agar pergantian gambar langsung terlihat tanpa tertahan cache browser.
- **Upload Gambar (`src/api/product.ts`)**: Menggunakan `FormData` dengan field `'file'` menuju `POST /products/{id}/image`. Wajib menyetel header `{ 'Content-Type': undefined }` pada Axios agar boundary multipart dihasilkan secara otomatis oleh browser (`multipart/form-data; boundary=...`).

### C. Alur HPP & Bill of Materials (BOM)
- Frontend **tidak pernah** menghitung atau menimpa kolom HPP (`hpp_total`) secara mandiri.
- HPP dikalkulasikan secara otomatis oleh backend saat bahan baku ditambahkan, diubah, atau dihapus melalui endpoint `/recipes/{product_id}/recipes/`.
- Frontend hanya menampilkan hasil kalkulasi breakdown biaya dan margin melalui endpoint `GET /products/{id}/pricing`.

---

## 7. Authentication Overview

Sistem autentikasi frontend mengelola token JWT Bearer terpusat melalui `src/components/common/AuthProvider.tsx` dan `src/api/client.ts`.

### A. Penyimpanan Kredensial (Storage Keys)
Didefinisikan di `src/constants/index.ts`:
- `toti_access_token`: Menyimpan string token JWT Bearer.
- `toti_user`: Menyimpan serialisasi JSON dari objek `User` (`id`, `name`, `role`, `roleLevel`, dsb.).
- `toti_lang`: Menyimpan preferensi bahasa i18n (`id` atau `en`).

### B. Request & Response Interceptors
- **Request Interceptor**: Setiap request HTTP yang dikirim oleh `apiClient` secara otomatis menyertakan header `Authorization: Bearer <token>` jika `toti_access_token` tersedia di `localStorage`.
- **Response Interceptor**: Jika response mengembalikan status `401 Unauthorized`, `toti_access_token` dan `toti_user` otomatis dihapus dari `localStorage`.

### C. Alur Autentikasi Aktual

1. **Seller Login**:
   - Endpoint: `POST /auth/login` dengan `{ username, password }`.
   - Respon mengembalikan `{ access_token, user_id, role_level, username }`.
   - Frontend memetakan `role_level` ke role internal (`owner`, `admin`, `staff`) lalu menyimpan token dan user ke context.

2. **Buyer Login & Register**:
   - **Email & Password Login**: `POST /auth/buyer/login`.
   - **Phone & Password Login**: `POST /auth/buyer/login-phone` (nomor telepon internasional via `InternationalPhoneInput`).
   - **WhatsApp OTP Login**:
     1. Form mengirim `POST /auth/verify/wa/start` dengan `{ phone_number }`.
     2. Backend merespon dengan `nonce` dan URL `deeplink` WhatsApp (`https://wa.me/...text=VERIFIKASI%20<nonce>`). Jika di lingkungan non-produksi dengan `mock_mode: true`, backend langsung mengembalikan `verify_token`.
     3. Frontend melakukan polling ke `GET /auth/verify/wa/status?nonce=<nonce>`.
     4. Setelah terverifikasi, frontend memanggil `POST /auth/buyer/login/otp` menggunakan `verify_token`.
   - **Registrasi Pembeli**: Mengikuti alur verifikasi WA di atas untuk mendapatkan `verify_token`, lalu mengirim `POST /auth/buyer/register` berisi data nama, email, nomor HP, password, dan `verify_token`.
   - **Reset Password**: Didukung untuk buyer via `POST /auth/buyer/reset-password` dan seller via `POST /auth/seller/...`.

---

## 8. API Integration Rules & Actual Status

Arsitektur kode integrasi API dibagi menjadi dua lapis:
1. **Layer API Murni (`src/api/`)**: Fungsi asinkronus murni yang membungkus endpoint HTTP Axios, schema interface DTO request/response dari backend (`client.ts`, `auth.ts`, `product.ts`, `stock.ts`, `recipe.ts`, `faq.ts`).
2. **Layer Service & Domain (`src/services/`)**: Logika bisnis sisi klien, pemetaan data backend ke format UI, penanganan fallback, dan cache keying.

### Matriks Status Integrasi Aktual:

| Domain / Modul | File Service / API | Status Integrasi Aktual | Catatan Teknis Implementasi |
| :--- | :--- | :---: | :--- |
| **Autentikasi Internal (Seller)** | `src/api/auth.ts` | **Fully Integrated** | Terhubung penuh ke `/auth/login`, `/auth/seller/forgot-password/*` |
| **Autentikasi Pelanggan (Buyer)** | `src/api/auth.ts` | **Fully Integrated** | Terhubung ke `/auth/verify/wa/*`, `/auth/buyer/login*`, `/auth/buyer/register` |
| **Katalog & Master Produk** | `src/api/product.ts`<br>`src/services/productService.ts` | **Fully Integrated** | CRUD produk, upload gambar multipart, patch harga, kalkulasi margin terhubung ke `/products/*` |
| **Resep / BOM Produk** | `src/api/recipe.ts` | **Fully Integrated** | Penambahan, update, dan penghapusan bahan pada resep terhubung ke `/recipes/{product_id}/recipes/` |
| **Stok Bahan Baku & Kemasan** | `src/api/stock.ts`<br>`src/services/sellerInventoryService.ts` | **Fully Integrated** | CRUD stock items terhubung ke `/stock/`. Optimistic lock `version` diterima dari backend |
| **FAQ Chatbot** | `src/api/faq.ts`<br>`src/services/sellerChatbotService.ts` | **Fully Integrated** | List, create, update, delete, toggle aktif FAQ terhubung ke `/faq` |
| **Pesanan Buyer (Checkout & History)** | `src/services/buyerOrderService.ts` | **Partially Integrated** | `getBuyerOrders()` menembak `/orders/buyer` dan checkout menembak `/orders`. Pembayaran pada checkout disimulasikan via `simulatePayment()`. Unknown / needs confirmation. |
| **Pesanan Seller & Invoice** | `src/services/sellerOrderService.ts` | **Dummy / Mock Data** | Menggunakan data in-memory lokal (`dummyOrders`, `dummyInvoices`). Belum terhubung ke endpoint `/orders` backend. |
| **Laporan Finansial & Dashboard** | `src/services/sellerFinanceService.ts`<br>`src/services/sellerService.ts` | **Dummy / Mock Data** | Menggunakan data statis (`dummyStats`, `dummySalesChart`). Belum terintegrasi dengan `/reports/financial` atau `/expenses`. |
| **Pengaturan Pengguna Internal** | `src/services/sellerSettingsService.ts` | **Dummy / Mock Data** | Menggunakan `dummyUsers` dan `dummyShopProfile` lokal. Belum terhubung ke `/users` backend. |
| **Ulasan Produk (Reviews)** | `src/services/productService.ts` | **Stub (Empty Array)** | Fungsi `getProductReviews()` mengembalikan array kosong `[]`. Belum terhubung ke `/reviews` backend. |

---

## 9. State Management Overview

Aplikasi menggunakan **React Context API** murni tanpa library state pihak ketiga (seperti Redux, Zustand, atau TanStack Query).

### A. Context Global
1. **`AuthContext` (`src/components/common/AuthProvider.tsx`)**:
   - Mengelola state `user`, `accessToken`, dan `isAuthenticated`.
   - Menginisialisasi state saat mount dari `localStorage` (`toti_access_token` dan `toti_user`).
   - Menyediakan aksi `login(token, user)`, `logout()`, `updateUser(partialUser)`.
   - Menyediakan helper boolean role: `isSeller`, `isOwner`, `isAdmin`, `isStaff`, `hasRole()`, `hasSellerRole()`.
   - Diakses via hook custom `useAuth()` (`src/hooks/useAuth.ts`).

2. **`CartContext` (`src/context/CartContext.tsx`)**:
   - Mengelola array belanja pembeli (`items`), total kuantitas (`totalItems`), dan total harga (`totalPrice`).
   - Tersinkronisasi secara otomatis ke `localStorage` dengan key `toti_cart`.
   - Menyediakan method `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`.
   - Setiap item memuat: `productId`, `variantId`, `name`, `variantName`, `price`, `quantity`, `image`, `minOrder`, `step`.
   - Diakses via hook custom `useCart()` (`src/context/CartContext.tsx`).

### B. Custom Data Fetching Hooks
- `useProducts(onlyActive)` (`src/hooks/useProducts.ts`): Mengambil daftar produk via `getAllProducts()` dengan status `loading`, `error`, dan fungsi `refetch()`.
- `useProduct(id)` (`src/hooks/useproduct.ts`): Mengambil detail satu produk via `getProductById(id)` dengan status `loading`, `error`, dan fungsi `refetch()`.

---

## 10. Localization (i18n)

1. **Konfigurasi (`src/lib/i18n.ts`)**:
   - Menggunakan `i18next` dengan ekstensi `react-i18next`.
   - File kamus terjemahan: `src/locales/id/translation.json` (Bahasa Indonesia) dan `src/locales/en/translation.json` (Bahasa Inggris).
   - Bahasa default: `'id'`, fallback: `'id'`.
   - Penyimpanan preferensi bahasa di `localStorage` dengan key `toti_lang`.

2. **Kondisi Penggunaan Aktual**:
   - Komponen yang aktif menggunakan terjemahan i18n (`useTranslation`):
     - `src/components/common/Languagetoggle.tsx`: Tombol pergantian bahasa ID/EN.
     - `src/components/common/WhatsAppButton.tsx`: Tooltip tombol WhatsApp.
     - `src/components/layout/BuyerNavbar.tsx`: Kontrol switch bahasa.
     - `src/pages/auth/Register.tsx`: Label dan placeholder registrasi akun pembeli.
   - **Catatan Aktual**: Sebagian besar halaman lain (HomePage, CatalogPage, Seller Dashboard, dsb.) masih menggunakan string teks Bahasa Indonesia secara langsung (*hardcoded strings*).

---

## 11. Global Styling & UI Conventions

1. **Tailwind CSS Configuration (`tailwind.config.js`)**:
   - Tidak mendefinisikan custom color token di `theme.extend`.
   - Styling komponen menggunakan nilai HEX spesifik (*arbitrary values*) yang konsisten:
     - Primary Terracotta: `#d85b30` (hover: `#c04e28`, background soft: `#ffe6d8`, `#fff1e9`)
     - Dark Espresso (Sidebar / Headings): `#3A1F16` dan `#4b2417`
     - Warm Amber / Gold (Aksen aktif): `#E0A04E`
     - Background Warm White / Cream: `#fffaf5` dan `#fffaf6`
     - Secondary Brown Text: `#6f5448`
     - Soft Beige Borders: `#ead8ca` dan `#d0bfaf`
2. **Kustomisasi Phone Input (`src/index.css`)**:
   - Meng-override selector internal `react-international-phone` agar menyatu dengan palet warna Toti Cakery (border radius, background dropdown, dan hover color).
3. **Format Mata Uang**:
   - Menggunakan utilitas `formatRupiah()` di `src/services/productService.ts` berbasis `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', ... })`.

---

## 12. Important Project Constraints

1. **Strict TypeScript Compliance**: Dilarang menggunakan tipe `any` tanpa alasan mendesak; seluruh DTO dan response API wajib memiliki tipe/interface eksplisit.
2. **No Direct API Calls in Pages/Views**: Komponen UI tidak boleh memanggil `axios` atau `fetch` langsung. Seluruh pemanggilan jaringan wajib melalui modul di `src/api/` dan diabstraksi oleh `src/services/`.
3. **Multipart Boundary Handling**: Setiap operasi upload gambar (`POST /products/{id}/image`) wajib mengatur `headers: { 'Content-Type': undefined }` pada Axios agar boundary multipart dibentuk oleh browser secara tepat.
4. **HPP Immutability on Frontend**: Frontend dilarang mengkalkulasi atau mengirim payload modifikasi kolom `hpp_total`. HPP sepenuhnya dihitung oleh backend FastAPI melalui relasi tabel `recipes`.
5. **International Phone Number Format**: Input nomor telepon wajib menggunakan standar E.164 (misal: `+6281234567890`) melalui komponen `InternationalPhoneInput`. Leading zero `0...` otomatis dipangkas menjadi kode negara yang dipilih.
6. **Relative Image URLs**: Backend menyimpan path relatif (`/static/products/...`). Frontend wajib membungkus path tersebut dengan `resolveImageUrl` sebelum dimasukkan ke tag `<img src="...">`.

---

## 13. Hal yang Belum Dapat Dipastikan (Unknown / Needs Confirmation)

Berdasarkan perbandingan antara source code FE aktual dan dokumentasi backend di `/project-context/BE/`:

1. **Buyer Order & Checkout API Contract**:
   - `buyerOrderService.ts` memanggil `GET /orders/buyer` dan `POST /orders`. Namun pada dokumentasi BE `API_ENDPOINT.md`, endpoint `/orders` diproteksi menggunakan `X-Service-Key` (dikhususkan untuk Chatbot Service) dan tidak ada dokumentasi publik/buyer JWT untuk checkout order langsung dari web.
   - *Status*: **Unknown / needs confirmation.**
2. **Web Payment Gateway Integration (Midtrans)**:
   - Backend menggunakan Midtrans Core API headless (`/charge`) via Chatbot Service, sementara pada frontend `CheckoutPage.tsx` alur pembayaran masih menggunakan simulasi timer lokal (`simulatePayment()`). Belum ada integrasi Midtrans Snap JS atau headless Core API untuk buyer web.
   - *Status*: **Unknown / needs confirmation.**
3. **Sinkronisasi Seller Orders & Invoices**:
   - Halaman `SellerOrdersPage.tsx` dan `SellerFinancePage.tsx` masih sepenuhnya memakai data dummy in-memory (`dummyOrders`, `dummyInvoices`), belum tersambung ke database transaksional FastAPI.
   - *Status*: **Unknown / needs confirmation.**
4. **Modul Pengeluaran & Laporan Finansial**:
   - Backend telah menyediakan endpoint `/expenses` dan `/reports/financial`, namun frontend `sellerFinanceService.ts` masih mengembalikan data hardcoded.
   - *Status*: **Unknown / needs confirmation.**
5. **Manajemen Pengguna Internal (Users CRUD)**:
   - Backend memiliki endpoint `/users` (Owner Only), tetapi `sellerSettingsService.ts` masih mengoperasikan array `dummyUsers` lokal.
   - *Status*: **Unknown / needs confirmation.**
6. **Product Reviews Integration**:
   - Backend memiliki endpoint `/reviews`, namun `productService.ts` masih mengembalikan array kosong `[]` dan belum ada antarmuka pembuatan review di buyer web.
   - *Status*: **Unknown / needs confirmation.**

---

## 14. AI Development Rules

Untuk AI Coding Assistant atau engineer yang bekerja di repositori ini:
1. **Konsistensi Layer**: Letakkan pemanggilan HTTP di `src/api/`, manipulasi/formatting bisnis di `src/services/`, dan rendering UI di `src/pages/` atau `src/components/`.
2. **Jangan Mengubah Kontrak yang Sudah Berjalan**: Modul Auth, Produk, Resep, Stok, dan FAQ Chatbot sudah terintegrasi penuh dengan backend FastAPI. Jangan mengubah skema payload atau header yang telah berjalan (khususnya multipart upload `Content-Type: undefined`).
3. **Penyimpanan Kredensial**: Selalu gunakan konstanta `TOKEN_KEY` (`toti_access_token`) dan `USER_KEY` (`toti_user`) dari `src/constants/index.ts`.
4. **Komponen Reusable**: Komponen yang digunakan berulang wajib diletakkan di `src/components/common/` (seperti `PhoneInput`, `WhatsAppButton`, `Languagetoggle`) atau `src/components/layout/`.
5. **Peringatan Modul Mock**: Sebelum melakukan refactor pada modul Seller Orders, Finance, Settings, atau Buyer Checkout, periksa bagian "Hal yang Belum Dapat Dipastikan" di atas dan koordinasikan kontrak endpoint dengan backend sebelum mengganti data dummy.
