// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'dosen' | 'mahasiswa';
  profile?: Mahasiswa | Dosen;
  lastLogin?: string;
}

export interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  semester: number;
  fotoProfil?: string;
  fotoWajah?: string;
  nomorHp?: string;
  alamat?: string;
}

export interface Dosen {
  id: number;
  nidn: string;
  nama: string;
  email: string;
  jurusan: string;
  fotoProfil?: string;
  nomorHp?: string;
  alamat?: string;
}

// Academic Types
export interface MataKuliah {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jurusan: string;
  deskripsi?: string;
}

export interface Kelas {
  id: number;
  nama: string;
  matkulId: number;
  dosenId: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  kapasitas: number;
  tahunAjaran: string;
  semester: string;
  matkul?: MataKuliah;
  dosen?: Dosen;
  mahasiswas?: Mahasiswa[];
}

export interface Enrollment {
  id: number;
  kelasId: number;
  mahasiswaId: number;
  tanggalEnroll: string;
  isActive: boolean;
  kelas?: Kelas;
  mahasiswa?: Mahasiswa;
}

// Device Types
export interface Device {
  id: number;
  deviceId: string;
  nama: string;
  lokasi: string;
  ruang: string;
  kelasId?: number;
  isActive: boolean;
  lastHeartbeat?: string;
  ipAddress?: string;
  status: 'online' | 'offline' | 'maintenance';
  kelas?: Kelas;
}

// Attendance Types
export interface SesiAbsensi {
  id: number;
  kelasId: number;
  dosenId: number;
  deviceId: number;
  judulSesi: string;
  waktuMulai: string;
  waktuSelesai?: string;
  durasiMenit: number;
  isActive: boolean;
  kodeSesi: string;
  kelas?: Kelas;
  dosen?: Dosen;
  device?: Device;
  absensis?: Absensi[];
}

export interface Absensi {
  id: number;
  sesiAbsensiId: number;
  mahasiswaId: number;
  waktuAbsen: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  lokasiAbsen?: string;
  confidence?: number;
  fotoWajah?: string;
  deviceId: number;
  ipAddress?: string;
  userAgent?: string;
  isValidated: boolean;
  keterangan?: string;
  mahasiswa?: Mahasiswa;
  sesiAbsensi?: SesiAbsensi;
  device?: Device;
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
}

export interface MahasiswaForm {
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  semester: number;
  nomorHp?: string;
  alamat?: string;
  createAccount?: boolean;
}

export interface DosenForm {
  nidn: string;
  nama: string;
  email: string;
  jurusan: string;
  nomorHp?: string;
  alamat?: string;
  createAccount?: boolean;
}

export interface MataKuliahForm {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jurusan: string;
  deskripsi?: string;
}

export interface KelasForm {
  nama: string;
  matkulId: number;
  dosenId: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  kapasitas: number;
  tahunAjaran: string;
  semester: string;
}

export interface DeviceForm {
  deviceId: string;
  nama: string;
  lokasi: string;
  ruang: string;
  kelasId?: number;
  isActive?: boolean;
}

export interface SesiAbsensiForm {
  kelasId: number;
  deviceId: number;
  judulSesi: string;
  durasiMenit: number;
}

// Dashboard Types
export interface DashboardStats {
  base: {
    totalMahasiswa: number;
    totalDosen: number;
    totalMataKuliah: number;
    totalKelas: number;
    totalDevices: number;
    activeDevices: number;
  };
  today: {
    totalSessions: number;
    totalAbsensi: number;
    hadir: number;
    alfa: number;
    hadirPercentage: number;
  };
  dosen?: {
    totalClasses: number;
    todaySessions: number;
    todayAbsensi: number;
    todayHadir: number;
    todayHadirPercentage: number;
    classes: Kelas[];
  };
  mahasiswa?: {
    totalAbsensi: number;
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    hadirPercentage: number;
    recentAbsensis: Absensi[];
    enrolledClasses: Kelas[];
  };
  monthly?: {
    totalSessions: number;
    totalAbsensi: number;
  };
  recentActivities?: Absensi[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Navigation Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  current?: boolean;
  roles?: string[];
  children?: NavigationItem[];
}

// Theme Types
export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}