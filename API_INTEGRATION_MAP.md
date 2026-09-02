# API Integration Map

## Base Configuration
* **Axios Instance**: `src/api/client.ts`
* **Base URL**: Set via `VITE_API_BASE_URL` (e.g., `http://localhost:8000/api/v1`)

## Endpoint Mapping

### Auth & User (`src/services/authService.ts`)
* `POST /auth/verify/wa/start` -> Inisiasi verifikasi WhatsApp
* `GET /auth/verify/wa/status/{session_id}` -> Polling status verifikasi WA
* `POST /auth/buyer/register` -> Registrasi akun buyer
* `POST /auth/login` -> Login user & penerimaan JWT token

### Products (`src/services/productService.ts`)
* `GET /products` -> Fetch list katalog produk (dengan pagination & filter)
* `GET /products/{id}` -> Fetch detail produk

### Orders & Payment (`src/services/orderService.ts`)
* `POST /orders` -> Membuat pesanan baru
* `POST /payments/snap-token` -> Generasi token Snap Midtrans

## Error Handling Standards
* **401 Unauthorized**: Redirect ke `/login` & hapus token dari LocalStorage.
* **422 Unprocessable Entity**: Tampilkan pesan validasi form di UI.
* **429 Rate Limit**: Tampilkan toast notification "Terlalu banyak permintaan".