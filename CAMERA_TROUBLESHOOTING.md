# Troubleshooting Kamera

## Masalah Umum dan Solusi

### 1. "Tidak dapat mengakses kamera" atau Kamera Tidak Menyala

**Penyebab:**
- Izin kamera belum diberikan
- Kamera sedang digunakan aplikasi lain
- Browser tidak mendukung

**Solusi:**

#### A. Memberikan Izin Kamera di Chrome
1. Klik ikon **kunci** atau **kamera** di sebelah kiri address bar
2. Cari pengaturan **Camera**
3. Pilih **Allow** atau **Izinkan**
4. Refresh halaman (F5)

#### B. Memberikan Izin Kamera di Firefox
1. Klik ikon **kamera** dengan tanda silang di address bar
2. Klik **Temporarily allow** atau **Allow**
3. Refresh halaman

#### C. Memberikan Izin Kamera di Safari
1. Buka menu **Safari** > **Settings for This Website**
2. Cari **Camera**
3. Pilih **Allow**
4. Refresh halaman

#### D. Sistem Operasi (macOS)
1. Buka **System Settings** > **Privacy & Security** > **Camera**
2. Pastikan browser Anda (Chrome/Firefox/Safari) ada dalam daftar dan dicentang
3. Restart browser

#### E. Sistem Operasi (Windows)
1. Buka **Settings** > **Privacy** > **Camera**
2. Pastikan **Allow apps to access your camera** ON
3. Pastikan browser Anda diizinkan
4. Restart browser

### 2. "Kamera sedang digunakan aplikasi lain"

**Solusi:**
- Tutup aplikasi yang menggunakan kamera (Zoom, Teams, Skype, dll)
- Tutup tab browser lain yang mungkin menggunakan kamera
- Restart browser

### 3. "Browser tidak mendukung kamera"

**Solusi:**
- Gunakan browser modern: Chrome 53+, Firefox 36+, Safari 11+, Edge 79+
- Update browser ke versi terbaru
- Pastikan mengakses melalui HTTPS atau localhost (http://localhost:8081)

### 4. Kamera Terdeteksi tapi Layar Hitam

**Solusi:**
- Pastikan kamera tidak tertutup/terblokir secara fisik
- Restart browser
- Restart komputer
- Coba browser lain

## URL yang Aman untuk Kamera

**⚠️ PENTING: Browser memblokir akses kamera pada koneksi HTTP yang tidak aman!**

Kamera hanya bisa diakses melalui:
- ✅ `https://` (SSL/TLS)
- ✅ `http://localhost:8081`
- ✅ `http://127.0.0.1:8081`
- ❌ `http://192.168.x.x:8081` (TIDAK BISA - diblokir browser)
- ❌ `http://` dengan IP/domain lain (tidak aman)

### Solusi "Not a secure context"

Jika muncul error **"Not a secure context"** atau **"Koneksi Tidak Aman"**:

**Penyebab:** Anda mengakses melalui IP address (misal: `http://192.168.1.25:8081`)

**Solusi:**
1. **Ganti URL ke localhost:**
   - Dari: `http://192.168.1.25:8081/dashboard/camera-absensi`
   - Ke: `http://localhost:8081/dashboard/camera-absensi`

2. **Atau gunakan HTTPS:**
   - Setup SSL certificate untuk production
   - Gunakan reverse proxy seperti nginx dengan SSL

## Testing

Untuk test apakah kamera berfungsi:
1. Buka https://webcamtests.com
2. Klik "Test my cam"
3. Berikan izin kamera
4. Jika kamera terlihat disana, berarti masalah ada di aplikasi

## Kontak

Jika masalah berlanjut, hubungi administrator sistem.
