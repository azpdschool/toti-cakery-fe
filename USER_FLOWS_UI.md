# User Flows & UI Journeys

## 1. Flow Checkout Pembeli
1. User memilih produk di `/catalog` dan menekan **Tambah ke Keranjang**.
2. User membuka drawer keranjang / halaman `/cart` lalu menekan **Checkout**.
3. Jika belum login, redirect ke `/login` lalu kembalikan ke `/checkout`.
4. Di `/checkout`, user mengisi alamat & memilih metode pengiriman.
5. User menekan **Bayar Sekarang** -> Pop-up Midtrans Snap muncul.
6. Setelah pembayaran selesai, redirect ke `/orders/{order_id}` dengan status sukses.

## 2. Flow Verifikasi WhatsApp
1. User menginput nomor WhatsApp pada form registrasi.
2. System menampilkan modal yang berisi QR / Link Deep-link WhatsApp.
3. Frontend melakukan polling status ke backend setiap 3 detik via `GET /auth/verify/wa/status/{session_id}`.
4. Setelah terverifikasi, modal tertutup otomatis dan form dilanjutkan.