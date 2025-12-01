# 📁 Struktur Folder Proyek Absensi Mahasiswa

## 🎯 Root Directory
```
absensi-mahasiswa/
├── backend/              # Backend API (Express + MySQL)
├── src/                  # Frontend React + TypeScript
├── public/               # Static files
└── node_modules/         # Dependencies
```

## 🔧 Backend Structure
```
backend/
├── src/
│   ├── index.ts                    # ✅ Main server file (ACTIVE)
│   ├── config/
│   │   └── database.ts            # Database configuration
│   ├── middleware/
│   │   └── auth.ts                # JWT authentication middleware
│   ├── models/                    # Sequelize models (not used - using raw queries)
│   ├── controllers/               # Old controllers (not used)
│   ├── routes/                    # Old routes (not used)
│   ├── services/                  # Business logic layer
│   ├── utils/
│   │   ├── jwt.ts                 # JWT utilities
│   │   ├── password.ts            # Password hashing
│   │   └── response.ts            # Response formatting
│   └── types/                     # TypeScript type definitions
├── dist/                          # Compiled JavaScript output
├── database_import.sql            # Database schema SQL
├── package.json
└── tsconfig.json
```

### 📝 Backend Routes (All in index.ts)
- **Auth**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **Mahasiswa**: `/api/mahasiswa` (GET, POST, PUT, DELETE)
- **Dosen**: `/api/dosen` (GET, POST, PUT, DELETE)
- **Mata Kuliah**: `/api/matakuliah` (GET, POST, PUT, DELETE)
- **Kelas**: `/api/kelas` (GET, POST, PUT, DELETE)
- **Enrollment**: `/api/enrollment` (GET, POST, DELETE)
- **Sesi Absensi**: `/api/sesi` (GET, POST, PUT, DELETE)
- **Absensi**: `/api/absensi` (GET, POST, PUT)
- **Device**: `/api/device` (GET, POST, PUT, DELETE)
- **Reports**: `/api/report/mahasiswa/:id`, `/api/report/kelas/:id`
- **Stats**: `/api/stats/admin`, `/api/stats/dosen/:id`, `/api/stats/mahasiswa/:id`

## 🎨 Frontend Structure
```
src/
├── main.tsx                       # Entry point
├── App.tsx                        # ✅ Main App with routing
├── index.css                      # Global styles
│
├── pages/                         # Page components
│   ├── Landing.tsx                # Landing page
│   ├── Login.tsx                  # ✅ Login page (ACTIVE)
│   ├── Auth.tsx                   # Old auth page (not used)
│   ├── Dashboard.tsx              # ✅ Main dashboard with routing
│   │
│   ├── admin/                     # Admin pages
│   │   ├── AdminDashboardHome.tsx # ✅ Admin home with stats
│   │   ├── MahasiswaManagement.tsx# ✅ CRUD Mahasiswa
│   │   ├── DosenManagement.tsx    # ✅ CRUD Dosen
│   │   ├── MataKuliahManagement.tsx# Management Mata Kuliah
│   │   ├── KelasManagement.tsx    # Management Kelas
│   │   └── ReportManagement.tsx   # Laporan & Reports
│   │
│   ├── lecturer/                  # Dosen pages
│   │   └── LecturerDashboard.tsx  # ✅ Dosen dashboard
│   │
│   └── student/                   # Mahasiswa pages
│       └── StudentDashboard.tsx   # ✅ Mahasiswa dashboard
│
├── components/                    # Reusable components
│   ├── ui/                        # shadcn/ui components
│   ├── layout/
│   │   └── MainLayout.tsx
│   └── features/
│
├── contexts/                      # React Context
│   └── AuthContext.tsx            # ✅ Global auth state
│
├── services/                      # API services
│   ├── api.ts                     # ✅ Axios instance with interceptors
│   └── authService.ts             # ✅ Auth API calls
│
├── hooks/                         # Custom hooks
│   ├── use-toast.ts
│   └── use-mobile.tsx
│
├── lib/                           # Utilities
│   └── utils.ts
│
└── types/                         # TypeScript types
    └── index.ts                   # ✅ Shared type definitions
```

## 🗄️ Database Structure
```
absensi_kampus (MySQL Database)
├── users                 # User accounts (admin, dosen, mahasiswa)
├── mahasiswa            # Student data
├── dosen                # Lecturer data
├── mata_kuliah          # Course data
├── kelas                # Class data
├── enrollment           # Student enrollment in classes
├── sesi_absensi         # Attendance sessions
├── absensi              # Attendance records
└── devices              # Registered devices
```

## 🚀 Running the Project

### Backend (Port 3001)
```bash
cd backend
npm install
npm run dev          # Development mode
npm run build        # Compile TypeScript
node dist/index.js   # Production mode
```

### Frontend (Port 8080)
```bash
npm install
npm run dev          # Development mode
npm run build        # Build for production
```

## 🔑 Environment Variables

### Backend (.env)
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=absensi_kampus
DB_PORT=3308
JWT_SECRET=secret-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## 📦 Key Dependencies

### Backend
- `express` - Web framework
- `mysql2` - MySQL client
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Frontend
- `react` + `react-dom` - UI framework
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client
- `shadcn/ui` - UI components
- `tailwindcss` - Styling

## ✅ Active Files (Currently Used)
- ✅ `backend/src/index.ts` - Main backend server
- ✅ `src/App.tsx` - Main app routing
- ✅ `src/pages/Login.tsx` - Login page
- ✅ `src/pages/Dashboard.tsx` - Dashboard routing
- ✅ `src/contexts/AuthContext.tsx` - Auth state
- ✅ `src/services/api.ts` - API client
- ✅ All admin management pages

## ❌ Unused Files (Can be deleted)
- ❌ `backend/src/controllers/` - Old controllers
- ❌ `backend/src/routes/` - Old routes  
- ❌ `backend/src/models/` - Sequelize models
- ❌ `src/pages/Auth.tsx` - Old auth page
- ❌ `src/integrations/supabase/` - Supabase integration

## 🎯 Authentication Flow
1. User login → POST `/api/auth/login`
2. Backend validates credentials
3. JWT token generated and returned
4. Frontend stores token in localStorage
5. Axios interceptor adds token to all requests
6. Backend middleware validates token
7. Protected routes accessible based on role

## 🔐 User Roles
- **admin**: Full access to all management features
- **dosen**: Manage classes and attendance
- **mahasiswa**: View classes and attendance records
