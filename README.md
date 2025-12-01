# 🎓 Sistem Absensi Mahasiswa

Sistem presensi kampus berbasis web dengan fitur lengkap untuk mahasiswa, dosen, dan admin.

## ✨ Fitur Lengkap

### 🔐 Untuk Mahasiswa
- ✅ Login menggunakan username  
- 📅 Melihat jadwal kuliah
- 📝 Melihat sesi presensi aktif
- ✋ Absensi kehadiran (scan wajah/QR/manual)
- 📊 Riwayat absensi pribadi per mata kuliah
- 🖼️ Profil dengan foto wajah
- ⏰ Validasi ketepatan waktu (hadir/terlambat)

### 👨‍🏫 Untuk Dosen
- 🔑 Login sebagai dosen
- 📚 Melihat daftar kelas yang diajar
- ⏰ Menjadwalkan sesi presensi (tanggal, waktu mulai/selesai)
- 👥 Melihat daftar mahasiswa per kelas (dari enrollment)
- ✅ Melihat absensi mahasiswa per sesi
- 📝 Mengubah status absensi (hadir/izin/sakit/alfa)
- 📈 Rekapitulasi absensi kelas
- 📊 Export laporan per kelas

### 🧑‍💻 Untuk Admin
- 👤 CRUD data mahasiswa (NIM, Nama, Jurusan, FotoWajah)
- 👨‍🏫 CRUD data dosen (NIDN, Nama, Email)
- 📖 CRUD mata kuliah (Kode, Nama, SKS, Semester)
- 🏫 CRUD kelas (Jadwal, Ruangan, Dosen, Mata Kuliah)
- 🔗 Kelola enrollment mahasiswa ke kelas
- 📊 Export laporan presensi (Excel/PDF)
- 📈 Dashboard statistik lengkap

## 🛠️ Tech Stack

**Frontend:** React 18 + TypeScript + Vite + TanStack Query + shadcn/ui + Tailwind CSS

**Backend:** Node.js + Express + TypeScript + MySQL 8.0 + JWT + bcryptjs

## 🚀 Quick Start

### 1. Setup Database
```bash
# Single file import - includes schema, tables, and dummy data
mysql -u root -P 3308 -h 127.0.0.1 < backend/database_setup.sql
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Start Frontend
```bash
npm install
npm run dev
```

## 👥 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Dosen | `dosen1`, `dosen2` | `admin123` |
| Mahasiswa | `mhs1`, `mhs2`, `mhs3` | `admin123` |

## 📊 Database Tables

- **users** - User accounts (admin/dosen/mahasiswa)
- **mahasiswa** - Student data  
- **dosen** - Lecturer data
- **mata_kuliah** - Course data
- **kelas** - Class data
- **enrollment** - Student-Class relationship
- **sesi_absensi** - Attendance sessions
- **absensi** - Attendance records
- **devices** - Attendance devices

## 🌐 Access

- **Frontend**: http://192.168.1.25:8080
- **Backend API**: http://192.168.1.25:3001/api
