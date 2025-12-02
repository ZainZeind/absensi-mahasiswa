# Sistem Absensi Mahasiswa

Aplikasi web untuk mengelola absensi mahasiswa dengan fitur camera-based attendance menggunakan webcam.

## 🚀 Fitur Utama

- **Dashboard Admin**: Kelola mahasiswa, dosen, mata kuliah, kelas, dan enrollment
- **Dashboard Dosen**: Buat sesi absensi, scan webcam mahasiswa, monitor kehadiran
- **Dashboard Mahasiswa**: Lihat jadwal kelas, sesi aktif, dan riwayat absensi
- **Camera Absensi**: Absensi menggunakan webcam dengan input NIM
- **Multi-role Authentication**: Admin, Dosen, Mahasiswa dengan JWT
- **Responsive Design**: Clean, minimal, modern UI

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TanStack Query (React Query)
- Shadcn UI + Tailwind CSS
- React Router

### Backend
- Node.js + Express + TypeScript
- MySQL2 (MySQL Database)
- JWT Authentication
- Bcrypt (Password Hashing)

## 📋 Prerequisites

- Node.js >= 18.x
- MySQL >= 8.x
- NPM atau Yarn

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/absensi-mahasiswa.git
cd absensi-mahasiswa
```

### 2. Setup Database

Buat database MySQL:

```sql
CREATE DATABASE absensi_kampus;
```

Import schema:

```bash
mysql -u root -p absensi_kampus < backend/database_schema.sql
```

Import dummy data (optional):

```bash
mysql -u root -p absensi_kampus < backend/seed_dummy_data.sql
```

### 3. Setup Backend

```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi database Anda
nano .env
```

Konfigurasi `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=absensi_kampus
DB_PORT=3306
PORT=3001
USE_HTTPS=true
JWT_SECRET=your-super-secret-key
```

**Untuk HTTPS (Opsional):**

```bash
# Generate SSL certificate untuk development
cd backend
./generate-ssl.sh
```

⚠️ **Note**: Browser akan menampilkan warning keamanan karena menggunakan self-signed certificate. Klik "Advanced" → "Proceed to localhost" untuk melanjutkan.

### 4. Setup Frontend

```bash
cd ..  # kembali ke root
npm install

# Copy environment file
cp .env.example .env

# Edit jika perlu
nano .env
```

### 5. Run Application

**Backend:**

```bash
cd backend
npm run dev
```

Backend akan running di `http://localhost:3001`

**Frontend:**

```bash
# Di terminal baru
npm run dev
```

Frontend akan running di `http://localhost:8080`

## 🔐 Default Login Credentials

Setelah import dummy data:

| Role | Username/Email | Password |
|------|----------------|----------|
| Admin | admin / admin@admin.ac.id | admin123 |
| Dosen | agussetiawan / agussetiawan@lecturer.ac.id | dosen123 |
| Mahasiswa | zainharist / zainharist@students.ac.id | mahasiswa123 |

⚠️ **PENTING**: Ganti password default setelah login pertama kali!

## 📱 Cara Penggunaan

### Admin
1. Login sebagai admin
2. Kelola data master: Mahasiswa, Dosen, Mata Kuliah, Kelas
3. Kelola enrollment (daftarkan mahasiswa ke kelas)
4. Monitor laporan kehadiran

### Dosen
1. Login sebagai dosen
2. Lihat kelas yang diajar
3. Buat sesi absensi untuk kelas
4. Aktifkan sesi dan buka kamera
5. Input NIM mahasiswa untuk absensi
6. Monitor kehadiran real-time

### Mahasiswa
1. Login sebagai mahasiswa
2. Lihat jadwal kelas yang diikuti
3. Lihat sesi absensi yang aktif
4. Lihat riwayat kehadiran

## 🎥 Camera Absensi

Fitur camera absensi menggunakan `getUserMedia` API yang membutuhkan:

- **Secure Context**: HTTPS atau localhost
- **Permission**: User harus mengizinkan akses kamera
- **Browser**: Chrome, Firefox, Safari, Edge (versi terbaru)

⚠️ **Catatan**: Camera hanya bisa diakses di `http://localhost` atau `https`. Tidak bisa di IP address seperti `http://192.168.x.x`

## 🔒 Security

Lihat [SECURITY.md](SECURITY.md) untuk panduan keamanan lengkap.

**Quick reminders:**
- ❌ JANGAN commit file `.env`
- ✅ Gunakan password kuat di production
- ✅ Ganti JWT_SECRET dengan random string
- ✅ Update dependencies secara rutin

## 📁 Struktur Folder

```
absensi-mahasiswa/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Main server
│   │   ├── config/           # Database config
│   │   ├── middleware/       # Auth middleware
│   │   └── types/            # TypeScript types
│   ├── database_schema.sql   # Database schema
│   ├── seed_dummy_data.sql   # Sample data
│   └── .env.example          # Environment template
├── src/
│   ├── pages/
│   │   ├── admin/           # Admin pages
│   │   ├── lecturer/        # Dosen pages
│   │   └── student/         # Mahasiswa pages
│   ├── components/          # Reusable components
│   ├── services/           # API services
│   └── types/              # TypeScript types
└── public/                 # Static files
```

## 🐛 Troubleshooting

### Camera tidak bisa diakses
- Pastikan mengakses via `http://localhost:8080` bukan IP
- Cek permission di browser
- Pastikan tidak ada aplikasi lain menggunakan camera

### Database connection error
- Cek MySQL service running: `mysql -u root -p`
- Cek konfigurasi di `.env`
- Cek port MySQL (default 3306)

### Backend not running
- Cek port 3001 tidak dipakai aplikasi lain
- Run `npm run dev` di folder backend
- Cek log error di terminal

## 📝 License

This project is private and for educational purposes only.

## 👥 Contact

For questions or issues, please contact the development team.
