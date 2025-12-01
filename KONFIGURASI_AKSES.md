# 🎯 Konfigurasi Akses Aplikasi

## Status Saat Ini

✅ **API Backend:** Selalu menggunakan `http://localhost:3001/api`  
✅ **Frontend:** Bisa diakses dari `http://localhost:8080` ATAU `http://192.168.1.25:8080`

## Cara Kerja

1. **API selalu ke localhost** - Dikonfigurasi hardcode di `src/services/api.ts`
2. **Frontend bisa dari mana saja** - Bisa akses via localhost atau IP network
3. **Kamera hanya di localhost** - Browser requirement untuk secure context

## Skenario Penggunaan

### ✅ Scenario 1: Akses dari Komputer Server (Recommended)
```
URL: http://localhost:8080
API: http://localhost:3001/api
Kamera: ✅ Berfungsi
```

**Gunakan ini untuk:**
- Absensi dengan kamera
- Testing lengkap
- Development

### ⚠️ Scenario 2: Akses dari Komputer Lain di Jaringan
```
URL: http://192.168.1.25:8080
API: http://localhost:3001/api (tetap ke server)
Kamera: ❌ Tidak berfungsi (not secure context)
```

**Bisa digunakan untuk:**
- Melihat dashboard
- Manage data mahasiswa/dosen/kelas
- Lihat rekap absensi
- **TIDAK bisa:** Absensi dengan kamera

## Kesimpulan

- **Untuk fitur kamera:** Harus akses dari `http://localhost:8080` (di komputer server)
- **Untuk fitur lain:** Bisa akses dari `http://192.168.1.25:8080` (komputer manapun)
- **API Backend:** Harus running di komputer yang sama dengan browser (localhost)

## Solusi untuk Akses Kamera dari Jaringan

Jika perlu akses kamera dari komputer lain, harus setup HTTPS. Lihat `SETUP_HTTPS.md`.
