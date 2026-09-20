# Absensi Guru - SMA Islam Pujer

Website absensi kehadiran + absensi mengajar guru. Guru scan QR code (statis, boleh dipakai
terus-menerus) untuk membuka website ini, lalu absen hanya bisa dilakukan jika HP guru berada
dalam radius tertentu dari titik koordinat sekolah.

## Cara menjalankan di komputer (lewat VS Code)

1. Install [Node.js](https://nodejs.org) (versi LTS) kalau belum ada.
2. Buka folder ini di VS Code.
3. Buka terminal di VS Code (menu Terminal > New Terminal), lalu jalankan:
   ```
   npm install
   ```
4. Salin file `.env.example` menjadi `.env`, lalu buka `.env` dan ganti:
   - `ADMIN_PASSWORD` — password login admin/kepala sekolah
   - `SESSION_SECRET` — isi teks acak apa saja, minimal 20 karakter
   - `RADIUS_METER` — jarak toleransi absen dari sekolah (default 150 meter)

   Koordinat sekolah (`SEKOLAH_LAT` dan `SEKOLAH_LNG`) sudah diisi sesuai titik lokasi yang
   kamu kirim. Kalau ternyata kurang tepat, bisa dikoreksi di file `.env` ini.
5. Jalankan servernya:
   ```
   npm start
   ```
6. Buka `http://localhost:3000` di browser untuk melihat halaman absen guru, dan
   `http://localhost:3000/admin.html` untuk halaman admin.

Data absensi tersimpan otomatis di `data/db.json` (dibuat sendiri saat server pertama jalan).

## Struktur data guru, kelas, jam pelajaran

Semua ada di file `seed-data.js`. Kalau mau menambah/mengubah guru, mapel, kelas, atau jam
pelajaran, edit langsung file itu (formatnya sudah jelas, tinggal ikuti contoh yang ada), lalu
restart server. Setiap guru otomatis mendapat pilihan tambahan "Kokurikuler" di form mengajar.

Kepala sekolah dan tata usaha diset `bisaMengajar: false` sehingga mereka hanya mengisi absen
kehadiran, tanpa form absen mengajar. Ini bisa diubah kalau ternyata mereka juga perlu absen
mengajar.

## Mengganti logo

Logo sekolah saat ini masih berupa lingkaran teks "SIP" (dibuat otomatis dari CSS, belum pakai
file gambar). Kalau kamu sudah punya file logo:

1. Taruh file logo (disarankan format PNG, background transparan) di folder `public/img/`,
   misal `public/img/logo.png`.
2. Di `public/index.html` dan `public/admin.html`, ganti bagian:
   ```html
   <div class="logo">SIP</div>
   ```
   menjadi:
   ```html
   <img src="img/logo.png" alt="Logo SMA Islam Pujer" style="width:56px;height:56px;border-radius:50%;" />
   ```

## Membuat QR code untuk absen

QR code cukup dibuat sekali dan boleh dipakai terus, karena yang membatasi absen bukan QR-nya,
tapi validasi lokasi GPS. QR ini cukup berisi tautan ke halaman absen, misalnya
`https://alamat-website-kamu.com/`.

Setelah website ini online (lihat bagian deploy di bawah), buat QR code dari alamat
websitenya lewat situs gratis seperti qr-code-generator.com atau me-generate lewat kode
(bisa saya bantu tambahkan fitur generate QR otomatis di halaman admin kalau kamu mau).
Cetak lalu tempel QR itu di titik absen (misal ruang guru).

## Deploy supaya bisa diakses online (pakai paket data)

Rekomendasi paling praktis dan gratis:

- **Hosting aplikasi**: [Render](https://render.com) — deploy langsung dari GitHub, gratis untuk
  skala kecil seperti ini.
- **Database**: karena versi ini masih memakai file `data/db.json`, kalau hosting gratis
  di-restart, isi file itu bisa ikut hilang (disk hosting gratis biasanya tidak permanen).
  Untuk pemakaian jangka panjang, langkah paling aman adalah pindah penyimpanan data dari
  `db.json` ke database online gratis seperti [Supabase](https://supabase.com) (PostgreSQL,
  datanya tidak akan hilang meski aplikasi tidur/restart).

  Kalau kamu sudah siap deploy, saya bisa bantu ubah bagian `db.js` supaya membaca/menulis ke
  Supabase alih-alih file `db.json`, tanpa mengubah tampilan atau alur yang sudah ada.

Langkah ringkas deploy ke Render:
1. Buat akun GitHub (jika belum ada), unggah folder proyek ini ke repository baru.
2. Buat akun di render.com, pilih "New Web Service", hubungkan ke repository GitHub tadi.
3. Isi "Build command": `npm install`, "Start command": `npm start`.
4. Tambahkan environment variables (ADMIN_PASSWORD, SESSION_SECRET, SEKOLAH_LAT, SEKOLAH_LNG,
   RADIUS_METER) di pengaturan Render, sama seperti isi file `.env`.
5. Setelah deploy selesai, Render memberi alamat website (misal
   `https://absensi-sma-islam-pujer.onrender.com`). Alamat inilah yang dijadikan QR code.

## Catatan lain

- Absensi dapat dilakukan setiap hari, termasuk hari Minggu.
- Setiap guru hanya bisa absen kehadiran satu kali per hari.
- Jarak guru terhadap sekolah dihitung otomatis lewat GPS HP guru (rumus haversine), jadi tidak
  bisa dicurangi dengan mengubah waktu di HP.
