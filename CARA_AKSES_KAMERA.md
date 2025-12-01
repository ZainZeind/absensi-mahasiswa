# 📸 Cara Mengakses Fitur Kamera Absensi

## ⚠️ ERROR: "Not a secure context" atau "Koneksi Tidak Aman"

### Penyebab
Browser **memblokir akses kamera** pada koneksi HTTP yang tidak aman (seperti `http://192.168.x.x`)

### ✅ Solusi Cepat

**Ganti URL dari IP address ke localhost:**

❌ **SALAH** (Tidak bisa akses kamera):
```
http://192.168.1.25:8081/dashboard/camera-absensi
```

✅ **BENAR** (Bisa akses kamera):
```
http://localhost:8081/dashboard/camera-absensi
```

### Langkah-langkah:

1. **Lihat address bar browser Anda**
   - Jika menampilkan IP address (192.168.x.x), kamera TIDAK akan berfungsi
   
2. **Ganti ke localhost**
   - Ganti bagian IP dengan `localhost`
   - Contoh: `http://localhost:8081/dashboard/camera-absensi`
   
3. **Tekan Enter**
   - Aplikasi akan reload dengan URL yang aman
   
4. **Klik "Nyalakan Kamera"**
   - Browser akan meminta izin
   - Klik "Allow" atau "Izinkan"

### 💡 Tips

**Untuk kemudahan akses:**
- Bookmark URL localhost: `http://localhost:8081`
- Selalu akses dari komputer yang menjalankan aplikasi
- Jangan gunakan IP address untuk fitur kamera

**Untuk akses dari komputer lain:**
- Fitur kamera hanya bisa digunakan di komputer server (localhost)
- Atau setup HTTPS dengan SSL certificate untuk production

### 🔧 Alternatif untuk Production

Jika ingin mengakses dari komputer lain dengan kamera:

1. **Setup HTTPS:**
   ```bash
   # Install mkcert
   brew install mkcert  # macOS
   
   # Generate certificate
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   
   # Update vite.config.ts untuk HTTPS
   ```

2. **Akses via HTTPS:**
   ```
   https://localhost:8081
   ```

## ❓ Masih Bermasalah?

Klik tombol **"Debug Info"** di pojok kanan atas halaman camera untuk melihat informasi detail.
