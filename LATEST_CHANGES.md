# Catatan Perubahan Terbaru (Latest Changes)

Dokumen ini mendokumentasikan pembaruan kode dan panduan pengujian untuk dua fitur utama:
1. **Perbaikan Bug Upload Gambar Produk (Error 422)**
2. **Implementasi Komponen International Phone Input**
3. **Integrasi Manajemen Pengguna (Users Management) ke Backend API**

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

## 3. Perbaikan Formatting Nomor Telepon (Sanitasi Digit Murni untuk Backend & Login)

### Permasalahan Sebelumnya:
- Komponen `PhoneInput` menghasilkan string yang membawa simbol `+` atau spasi (contoh: `"+6281299998888"` atau `"+62 81299998888"`).
- Backend FastAPI dan database PostgreSQL mengharapkan format digit murni tanpa simbol (contoh: `"6281299998888"`).
- Format yang tidak konsisten ini menyebabkan kegagalan pencocokan (*mismatch*) pada query database saat login pembeli (`POST /auth/buyer/login-phone`) dan verifikasi WhatsApp (`POST /auth/verify/wa/start`).

### Solusi & Perubahan Kode:
1. **Helper Utility `formatPhoneNumber` (`src/utils/phone.ts`)**:
   - Menghapus seluruh karakter non-digit (`\D`).
   - Mengubah awalan `0` menjadi `62` (misal `08123456789` $\rightarrow$ `628123456789`).
   - Menjaga prefix `62` tetap `62` (misal `+62 812 9999 8888` $\rightarrow$ `6281299998888`).
   - Menangani kasus nomor dengan kode ganda/redundant `+6208...` $\rightarrow$ `628...`.
   - Diekspor juga melalui `src/components/common/PhoneInput.tsx` untuk kemudahan impor.
2. **Sanitasi di Seluruh Form Auth Buyer**:
   - `src/pages/auth/BuyerLoginPage.tsx`: Sanitasi nomor HP pada login No HP + Password, login No HP + WhatsApp OTP, dan pendaftaran akun.
   - `src/pages/auth/Register.tsx`: Sanitasi nomor HP pada formulir registrasi pembeli dan polling verifikasi.
   - `src/pages/auth/BuyerForgotPasswordPage.tsx`: Sanitasi nomor HP sebelum memanggil request OTP WhatsApp.
   - `src/pages/buyer/ProfilePage.tsx`: Sanitasi nomor HP pada modal ubah nomor telepon dan permintaan OTP WhatsApp.
3. **Defense-in-Depth API Layer (`src/api/auth.ts`)**:
   - Fungsi `startWAVerification`, `loginBuyerPhone`, `loginBuyerOtp`, dan `registerBuyer` secara otomatis membersihkan field `phone_number` / `phone` menggunakan `formatPhoneNumber` sebelum mengirim HTTP request ke backend.

---

## 4. Panduan Pengujian (Testing Guide)

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

### D. Pengujian Formatting Nomor Telepon Digit Murni (Auth & WhatsApp)
1. Buka halaman login buyer `/auth/buyer`, pilih tab **No HP**:
   - Masukkan nomor HP (misal: `+62 812 9999 8888` atau `081299998888`) dan password.
   - Klik **"Login dengan No HP"**.
   - Periksa Network tab: Request `POST /auth/buyer/login-phone` membawa payload `{"phone_number": "6281299998888", "password": "..."}` tanpa tanda `+` atau spasi.
2. Pilih tab **WhatsApp**:
   - Masukkan nomor HP.
   - Klik **"Verifikasi WhatsApp & Login"**.
   - Periksa Network tab: Request `POST /auth/verify/wa/start` membawa payload `{"phone_number": "6281299998888"}`.
3. Buka halaman lupa password buyer `/auth/buyer/forgot-password`:
   - Masukkan nomor HP (misal: `081234567890`).
   - Klik **"Kirim OTP"**.
   - Periksa Network tab: Request `POST /auth/verify/wa/start` membawa payload `{"phone_number": "6281234567890"}`.

---

## 5. Integrasi Manajemen Pengguna (Users Management) ke Backend API

### Permasalahan Sebelumnya:
- Data pengguna pada halaman Pengaturan Toko (`/seller/settings`) masih menggunakan data *mock* (dummy) statis di frontend.
- Form penambahan pengguna baru hanya menyimpan data sementara di _state_ lokal dan menggunakan _camelCase_ yang tidak kompatibel dengan skema Pydantic backend FastAPI.

### Solusi & Perubahan Kode:
1. **Service Layer (`src/services/sellerSettingsService.ts`)**:
   - Menghapus data *mock* statis pengguna (Jake Hartono, Ayu Admin, dsb).
   - Mengubah fungsi `getUsers()` untuk memanggil `GET /users/` menggunakan Axios instance (`src/api/client.ts`).
   - Mengubah fungsi `addUser(data)` untuk mengirim request `POST /users/`.
   - Menyesuaikan antarmuka `UserProfile` agar sesuai dengan response backend: `id` bertipe number, dan menggunakan konvensi penamaan `snake_case` (`username`, `role_id`, `email`, `phone_number`, `is_active`).

2. **UI & Formulir Pengguna (`src/pages/seller/SellerSettingsPage.tsx`)**:
   - Menyesuaikan struktur _state_ `formData` di `UserModal` agar kompatibel dengan `snake_case`. Menghapus field `name` dan menyesuaikan tipe `role_id` menjadi _integer_ (1: Owner, 2: Admin, 3: Staff).
   - Menambahkan mekanisme *refetching* otomatis (`loadUsers()`) setelah `addUser` berhasil dipanggil.
   - Menambahkan pesan notifikasi (Toast) "Pengguna berhasil ditambahkan!" saat proses penambahan pengguna berhasil dilakukan.
   - Menangani error respon validasi dari backend dan menampilkannya di _alert_.

### Panduan Pengujian:
1. Buka halaman Pengaturan Toko (`/seller/settings`) lalu arahkan ke tab **Pengguna**.
2. Pastikan tabel pengguna menampilkan data asli yang bersumber dari server backend (Network request ke `GET /users/`).
3. Klik tombol **Tambah**, lalu isi formulir (Username, Email, Nomor WhatsApp, Role, dan Password).
4. Klik **Tambah Pengguna**:
   - Pastikan Network request `POST /users/` membawa payload berformat JSON `snake_case` dan *Authorization Header* Bearer Token terlampir.
   - Periksa kemunculan notifikasi sukses (Toast) di pojok kanan bawah.
   - Pastikan tabel otomatis termuat ulang dan menampilkan data pengguna baru tanpa *refresh* halaman.
