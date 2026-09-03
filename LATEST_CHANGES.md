# Catatan Perubahan Terbaru (Latest Changes)

Dokumen ini mendokumentasikan pembaruan kode dan panduan pengujian untuk dua fitur utama:
1. **Perbaikan Bug Upload Gambar Produk (Error 422)**
2. **Implementasi Komponen International Phone Input**

---

## 1. Perbaikan Bug Upload Gambar Produk (Fix Error 422)

### Permasalahan Sebelumnya:
- Terjadi HTTP Error `422 Unprocessable Entity` saat mengunggah gambar produk ke backend FastAPI (`POST /products/{id}/image`).
- Penyebab utama: Axios instance memiliki default header `'Content-Type': 'application/json'`. Ketika mengirim `FormData`, jika `Content-Type` tidak disetel ulang ke `undefined`, Axios tidak membiarkan browser membuat boundary multipart (`multipart/form-data; boundary=...`), sehingga FastAPI gagal mem-parsing file multipart.

### Solusi & Perubahan Kode:
1. **API Client Request Header (`src/api/product.ts`)**:
   - Memastikan `FormData` dibentuk dengan key `'file'` (`formData.append('file', file)`).
   - Mengatur `headers: { 'Content-Type': undefined }` pada panggilan `apiClient.post` agar Axios dan browser secara otomatis mengeset header `multipart/form-data` dengan parameter boundary yang valid untuk FastAPI.
2. **Product Service (`src/services/productService.ts`)**:
   - Memastikan fungsi `uploadProductImage(productId: number, file: File): Promise<SimpleProduct>` menerima `productId` dan `file`, memanggil API layer, lalu mengembalikan data produk bertipe `SimpleProduct`.
3. **UI Handling & Feedback (`src/pages/seller/SellerProductsPage.tsx`)**:
   - Menambahkan loading spinner (`Loader2`) pada tombol aksi simpan saat proses upload gambar atau simpan produk berlangsung.
   - Menambahkan komponen Floating Toast Notification untuk memberikan umpan balik sukses/gagal yang elegan saat gambar/produk berhasil diunggah atau mengalami error.
   - Menghilangkan type `any` demi strict TypeScript compliance.

---

## 2. Komponen International Phone Input

### Fitur & Aturan Input:
1. **Komponen Reusable (`src/components/common/PhoneInput.tsx`)**:
   - Menggunakan library `react-international-phone` dengan styling kustom Tailwind CSS bertema Toti Cakery (warna terracotta `#d85b30`, border `#d0bfaf`, dan rounded modern).
   - Mengimpor stylesheet CSS bawaan (`react-international-phone/style.css`) dan aturan tambahan di `src/index.css` agar dropdown dan bendera negara tampil rapi.
   - **Default Country**: Indonesia (`+62` / `id`).
   - **Auto-strip Leading Zero**: Jika pengguna memasukkan nomor yang diawali angka `0` (misalnya `0821...` menjadi `+620821...`), regex otomatis mengubahnya menjadi `+62821...`.
   - **Output Format**: Format standar internasional E.164 (misal `+6282115835793`).
   - Pure TypeScript tanpa type `any`.

2. **Form Registrasi Buyer (`src/pages/auth/Register.tsx` & `src/pages/auth/BuyerLoginPage.tsx`)**:
   - Komponen `InternationalPhoneInput` dipasang pada formulir registrasi akun baru.
   - Terintegrasi dengan flow verifikasi WhatsApp (mock mode & real mode).
   - Route `/auth/buyer/register` dan `/register` didaftarkan pada router.

3. **Halaman Profil Buyer (`src/pages/buyer/ProfilePage.tsx`)**:
   - **Tampilan Statis Bersih**: Menampilkan nomor WhatsApp akun dalam format teks bersih tanpa country selector terpisah yang mengganggu UI.
   - **Modal Ubah Nomor HP**: Tersedia tombol "Ubah" yang membuka modal interaktif berisi `InternationalPhoneInput`, status loader saat menyimpan, pesan validasi/error, serta toast notifikasi berhasil.
   - State user dan local storage langsung tersinkronisasi via `updateUser` di `AuthProvider`.

4. **Multi-language Support (i18n)**:
   - String terkait input nomor HP dan registrasi ditambahkan ke `src/locales/id/translation.json` dan `src/locales/en/translation.json`.

---

## 3. Panduan Pengujian (Testing Guide)

### A. Pengujian Upload Gambar Produk (Seller)
1. Buka halaman Seller Products (`/seller/products`).
2. Klik tombol **"Tambah Produk"** atau klik **"Edit"** pada salah satu produk yang sudah ada.
3. Pada bagian **Gambar Produk**, klik **"Pilih Gambar"** dan pilih file gambar berformat `.jpg`, `.png`, atau `.webp` (< 5MB).
4. Klik tombol **"Simpan Produk"** / **"Simpan Perubahan"**:
   - Pastikan tombol menampilkan loader `Menyimpan...`.
   - Periksa Network tab di Developer Tools: Request `POST /products/{id}/image` memiliki payload multipart `file` dengan header `Content-Type: multipart/form-data; boundary=...`.
   - Pastikan toast notification sukses muncul di pojok kanan bawah.

### B. Pengujian International Phone Input (Registrasi)
1. Buka halaman registrasi `/register` (atau tab Register di `/auth/buyer`).
2. Periksa dropdown negara: Secara default terpilih **Indonesia (+62)**.
3. Ketik nomor HP dengan awalan `0` (contoh: `081234567890`):
   - Pastikan angka `0` di depan otomatis terhapus sehingga nomor yang terisi menjadi `81234567890` dengan kode negara `+62` (output `+6281234567890`).
4. Coba ganti pilihan negara melalui dropdown (misal: Malaysia `+60` atau Singapura `+65`) dan pastikan bendera serta kode panggilan menyesuaikan dengan benar.

### C. Pengujian Ubah Nomor HP di Profil Buyer
1. Buka halaman `/profile` setelah login sebagai buyer.
2. Periksa kartu **Nomor WhatsApp**: nomor ditampilkan dalam format teks bersih tanpa dropdown negara terpisah.
3. Klik tombol **"Ubah"** di samping label Nomor WhatsApp.
4. Modal Ubah Nomor HP akan muncul:
   - Masukkan nomor HP baru menggunakan `InternationalPhoneInput`.
   - Klik **"Simpan Nomor"**.
   - Pastikan loading indicator muncul saat menyimpan dan toast notifikasi sukses ditampilkan.
   - Nomor HP baru langsung diperbarui pada tampilan profil.
