export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'dosen' | 'mahasiswa';
  profile?: any;
  lastLogin?: string;
  foto_wajah?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface Mahasiswa {
  id: number;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  semester: number;
  foto_profil?: string;
  foto_wajah?: string;
  nomor_hp?: string;
  alamat?: string;
}

export interface Dosen {
  id: number;
  nidn: string;
  nama: string;
  email: string;
  jurusan: string;
  foto_profil?: string;
  nomor_hp?: string;
  alamat?: string;
}

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
  matkul_id: number;
  dosen_id: number;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  kapasitas: number;
  tahun_ajaran: string;
  semester: 'Ganjil' | 'Genap';
}

export interface Absensi {
  id: number;
  mahasiswa_id: number;
  kelas_id: number;
  tanggal: string;
  status: 'Hadir' | 'Tidak Hadir' | 'Izin' | 'Sakit';
  jam_masuk?: string;
  foto_absensi?: string;
  keterangan?: string;
}
