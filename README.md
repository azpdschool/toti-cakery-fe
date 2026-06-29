# 🍰 Toti Cakery - Frontend

Halo! 👋

Ini adalah aplikasi frontend untuk **Toti Cakery**, sistem pemesanan dan manajemen toko kue. Panduan ini akan membantu kamu menjalankan aplikasi di lokal dengan cepat.

---

## 📋 Prasyarat

Pastikan komputer kamu sudah terinstall:

- **Node.js** versi **18** atau lebih baru ([download di sini](https://nodejs.org/))
- **npm** (biasanya sudah termasuk Node.js)

Cek versi dengan perintah:
```bash
node -v
npm -v
```

---

## 🚀 Langkah Menjalankan Aplikasi

### 1. Clone Repository
```bash
git clone https://github.com/azpdschool/toti-cakery-fe.git
cd toti-cakery-fe
```

### 2. Install Dependencies
```bash
npm install
```
> Proses ini akan mengunduh semua package yang dibutuhkan (React, Vite, Tailwind, dll.).

### 3. (Opsional) Buat File Environment
Buat file `.env` di root folder jika ingin mengubah nomor WhatsApp default:
```env
VITE_WHATSAPP_NUMBER=6281234567890
```
> Jika tidak dibuat, aplikasi akan menggunakan nomor fallback `6281234567890`.

### 4. Jalankan Development Server
```bash
npm run dev
```
Setelah berhasil, akan muncul tulisan seperti:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 5. Buka di Browser
Akses alamat **`http://localhost:5173`**

---

## 🔧 Perintah Lainnya

| Perintah | Fungsi |
| :--- | :--- |
| `npm run build` | Build aplikasi untuk produksi ke folder `dist` |
| `npm run preview` | Pratinjau hasil build secara lokal |
| `npm run lint` | Jalankan ESLint untuk memeriksa kode |

---

## 📁 Struktur Penting (yang mungkin kamu butuh)

- **`src/pages/`** – Semua halaman (buyer & seller)
- **`src/services/`** – Service-layer dengan **dummy data** (tidak perlu koneksi backend)
- **`src/context/`** – Context untuk auth dan cart
- **`src/assets/`** – Gambar statis (logo, icon sosial media)

> **Catatan:** Jika ada gambar yang tidak muncul (misal logo), pastikan file `logo.png`, `instagram.png`, `whatsapp.png` ada di folder `src/assets`. Kamu bisa mengganti dengan gambar placeholder jika perlu.

---

## 🛠️ Teknologi yang Digunakan

- **React 18** + TypeScript
- **Vite** sebagai build tool
- **Tailwind CSS** untuk styling
- **React Router v6** untuk routing
- **i18next** untuk multi-bahasa (ID/EN)
- **Axios** (untuk persiapan API, tapi saat ini semua data dummy)
- **Lucide React** untuk icon

---

## ❓ Troubleshooting

| Masalah | Solusi |
| :--- | :--- |
| `command not found: npm` | Node.js belum terinstall. Download dari [nodejs.org](https://nodejs.org/). |
| Port `5173` sudah dipakai | Hentikan proses lain yang menggunakan port tersebut, atau ubah port di `vite.config.ts`. |
| Gambar tidak muncul | Pastikan file gambar ada di `src/assets/`, atau ganti path-nya. |
| Error saat `npm install` | Hapus folder `node_modules` dan file `package-lock.json`, lalu jalankan `npm install` ulang. |

---

## 🛑 Menghentikan Server

Tekan **`Ctrl + C`** di terminal.

---

## 📞 Kontak

Jika ada kendala, hubungi tim atau buka issue di repository. Selamat mencoba! 😄
