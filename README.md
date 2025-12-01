# 🎓 Sistem Absensi Mahasiswa

Sistem absensi kampus berbasis web menggunakan React + TypeScript untuk frontend dan Express + MySQL untuk backend.

## ✨ Fitur Utama

### 👨‍💼 Admin
- ✅ Dashboard dengan statistik lengkap
- ✅ CRUD Mahasiswa (Create, Read, Update, Delete)
- ✅ CRUD Dosen (Create, Read, Update, Delete)
- ✅ Management Mata Kuliah
- ✅ Management Kelas
- ✅ Laporan Kehadiran
- ✅ Management Device

### 👨‍🏫 Dosen
- 📊 Dashboard dengan statistik kelas
- 📝 Kelola sesi absensi
- 👥 Lihat daftar mahasiswa per kelas
- 📈 Monitor kehadiran mahasiswa

### 👨‍🎓 Mahasiswa
- 📊 Dashboard kehadiran pribadi
- 📚 Lihat kelas terdaftar
- ✅ Submit absensi
- 📈 Lihat statistik kehadiran

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0
- XAMPP (untuk MySQL) atau MySQL Server standalone

### 1. Setup Database
```bash
# Start XAMPP MySQL (port 3308)
# Import database schema
mysql -u root -p absensi_kampus < backend/database_import.sql
```

### 2. Setup Backend
```bash
cd backend
npm install

# Compile TypeScript
npx tsc src/index.ts --outDir dist --esModuleInterop --resolveJsonModule --skipLibCheck --target ES2020 --module commonjs

# Run server
node dist/index.js
```

Backend: **http://localhost:3001**

### 3. Setup Frontend
```bash
npm install
npm run dev
```

Frontend: **http://localhost:8080**

## 🔐 Login
- Username: `admin`
- Password: `admin123`

## 📁 Struktur
Lihat [STRUKTUR_FOLDER.md](./STRUKTUR_FOLDER.md)

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query

**Backend:** Node.js, Express, TypeScript, MySQL, JWT, bcrypt

## 📡 API Endpoints

### Auth
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user

### CRUD Endpoints
- `/api/mahasiswa` - Mahasiswa CRUD
- `/api/dosen` - Dosen CRUD
- `/api/matakuliah` - Mata Kuliah CRUD
- `/api/kelas` - Kelas CRUD
- `/api/enrollment` - Enrollment management
- `/api/sesi` - Sesi Absensi CRUD
- `/api/absensi` - Absensi records
- `/api/device` - Device management

### Reports
- GET `/api/report/mahasiswa/:id` - Student report
- GET `/api/report/kelas/:id` - Class report
- GET `/api/stats/admin` - Admin statistics
- GET `/api/stats/dosen/:id` - Lecturer stats
- GET `/api/stats/mahasiswa/:id` - Student stats

## 🗄️ Database Tables
- users, mahasiswa, dosen, mata_kuliah, kelas
- enrollment, sesi_absensi, absensi, devices

## 📝 TODO
- [ ] Face recognition
- [ ] Real-time notifications
- [ ] PDF/Excel export
- [ ] Mobile app
- [ ] QR Code attendance
- [ ] Geolocation verification

## 📄 License
MIT License

---
Made with ❤️ for Indonesian Universities
