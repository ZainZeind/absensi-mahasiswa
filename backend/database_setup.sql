-- ============================================
-- Database: absensi_kampus
-- Sistem Absensi Mahasiswa
-- ============================================

CREATE DATABASE IF NOT EXISTS absensi_kampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE absensi_kampus;

-- ============================================
-- TABLE DEFINITIONS
-- ============================================

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dosen', 'mahasiswa') NOT NULL DEFAULT 'mahasiswa',
    profile_id INT UNSIGNED NULL,
    profile_type ENUM('mahasiswa', 'dosen') NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table mahasiswa
CREATE TABLE IF NOT EXISTS mahasiswa (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    jurusan VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 14),
    foto_profil VARCHAR(255) NULL,
    foto_wajah VARCHAR(255) NULL,
    nomor_hp VARCHAR(15) NULL,
    alamat TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_nim (nim),
    INDEX idx_email (email),
    INDEX idx_jurusan (jurusan),
    INDEX idx_semester (semester)
);

-- Table dosen
CREATE TABLE IF NOT EXISTS dosen (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nidn VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    jurusan VARCHAR(100) NOT NULL,
    foto_profil VARCHAR(255) NULL,
    nomor_hp VARCHAR(15) NULL,
    alamat TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_nidn (nidn),
    INDEX idx_email (email),
    INDEX idx_jurusan (jurusan)
);

-- Table mata_kuliah
CREATE TABLE IF NOT EXISTS mata_kuliah (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    sks INT NOT NULL CHECK (sks >= 1 AND sks <= 6),
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 14),
    jurusan VARCHAR(100) NOT NULL,
    deskripsi TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_kode (kode),
    INDEX idx_jurusan (jurusan),
    INDEX idx_semester (semester)
);

-- Table kelas
CREATE TABLE IF NOT EXISTS kelas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    matkul_id INT UNSIGNED NOT NULL,
    dosen_id INT UNSIGNED NOT NULL,
    hari ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    ruang VARCHAR(20) NOT NULL,
    kapasitas INT NOT NULL CHECK (kapasitas >= 1),
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (matkul_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_matkul_dosen (matkul_id, dosen_id),
    INDEX idx_hari (hari),
    INDEX idx_ruang (ruang),
    INDEX idx_tahun_ajaran (tahun_ajaran)
);

-- Table devices
CREATE TABLE IF NOT EXISTS devices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    lokasi VARCHAR(100) NOT NULL,
    ruang VARCHAR(20) NOT NULL,
    kelas_id INT UNSIGNED NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_heartbeat TIMESTAMP NULL,
    ip_address VARCHAR(45) NULL,
    status ENUM('online', 'offline', 'maintenance') NOT NULL DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_device_id (device_id),
    INDEX idx_lokasi (lokasi),
    INDEX idx_status (status)
);

-- Table sesi_absensi
CREATE TABLE IF NOT EXISTS sesi_absensi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kelas_id INT UNSIGNED NOT NULL,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NULL,
    materi TEXT NULL,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_kelas (kelas_id),
    INDEX idx_tanggal (tanggal),
    INDEX idx_status (status)
);

-- Table enrollment (Many-to-Many: Kelas x Mahasiswa)
CREATE TABLE IF NOT EXISTS enrollment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kelas_id INT UNSIGNED NOT NULL,
    mahasiswa_id INT UNSIGNED NOT NULL,
    tanggal_enroll TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY unique_enrollment (kelas_id, mahasiswa_id),
    INDEX idx_kelas_id (kelas_id),
    INDEX idx_mahasiswa_id (mahasiswa_id)
);

-- Table absensi
CREATE TABLE IF NOT EXISTS absensi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesi_id INT UNSIGNED NOT NULL,
    mahasiswa_id INT UNSIGNED NOT NULL,
    waktu_absen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('hadir', 'izin', 'sakit', 'alfa') NOT NULL DEFAULT 'hadir',
    metode ENUM('face_recognition_device', 'webcam', 'manual') NOT NULL DEFAULT 'webcam',
    lokasi VARCHAR(100) NULL,
    foto_wajah VARCHAR(255) NULL,
    device_id INT UNSIGNED NULL,
    catatan TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (sesi_id) REFERENCES sesi_absensi(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY unique_absensi (sesi_id, mahasiswa_id),
    INDEX idx_sesi_mahasiswa (sesi_id, mahasiswa_id),
    INDEX idx_waktu_absen (waktu_absen),
    INDEX idx_status (status),
    INDEX idx_metode (metode)
);

-- ============================================
-- DEFAULT DATA & SAMPLE DATA
-- ============================================

-- Insert default admin user (Password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@absensi.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample mata kuliah
INSERT INTO mata_kuliah (kode, nama, sks, semester, jurusan, deskripsi) VALUES
('IF101', 'Pemrograman Web', 3, 3, 'Teknik Informatika', 'Mempelajari dasar-dasar pemrograman web menggunakan HTML, CSS, dan JavaScript'),
('IF102', 'Algoritma dan Struktur Data', 4, 2, 'Teknik Informatika', 'Mempelajari konsep algoritma dan struktur data fundamental'),
('SI101', 'Sistem Informasi Manajemen', 3, 4, 'Sistem Informasi', 'Mempelajari konsep dan implementasi sistem informasi dalam manajemen')
ON DUPLICATE KEY UPDATE id=id;

-- Insert dummy dosen
INSERT INTO dosen (nidn, nama, email, jurusan, nomor_hp) VALUES
('0001234567', 'Dr. Ahmad Fauzi', 'ahmad.fauzi@kampus.ac.id', 'Teknik Informatika', '081234567890'),
('0002234568', 'Dr. Siti Nurhaliza', 'siti.nurhaliza@kampus.ac.id', 'Sistem Informasi', '081234567891')
ON DUPLICATE KEY UPDATE id=id;

-- Insert dummy mahasiswa  
INSERT INTO mahasiswa (nim, nama, email, jurusan, semester, nomor_hp) VALUES
('2021010001', 'Budi Santoso', 'budi.santoso@student.kampus.ac.id', 'Teknik Informatika', 5, '081234567892'),
('2021010002', 'Ani Wijaya', 'ani.wijaya@student.kampus.ac.id', 'Teknik Informatika', 5, '081234567893'),
('2021020001', 'Citra Dewi', 'citra.dewi@student.kampus.ac.id', 'Sistem Informasi', 3, '081234567894')
ON DUPLICATE KEY UPDATE id=id;

-- Insert users untuk dosen (Password: admin123)
INSERT INTO users (username, email, password, role, profile_id, profile_type) VALUES
('dosen1', 'ahmad.fauzi@kampus.ac.id', '$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2', 'dosen', 1, 'dosen'),
('dosen2', 'siti.nurhaliza@kampus.ac.id', '$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2', 'dosen', 2, 'dosen')
ON DUPLICATE KEY UPDATE password='$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2';

-- Insert users untuk mahasiswa (Password: admin123)
INSERT INTO users (username, email, password, role, profile_id, profile_type) VALUES
('mhs1', 'budi.santoso@student.kampus.ac.id', '$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2', 'mahasiswa', 1, 'mahasiswa'),
('mhs2', 'ani.wijaya@student.kampus.ac.id', '$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2', 'mahasiswa', 2, 'mahasiswa'),
('mhs3', 'citra.dewi@student.kampus.ac.id', '$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2', 'mahasiswa', 3, 'mahasiswa')
ON DUPLICATE KEY UPDATE password='$2b$12$ePVEBNaCqYX2DIo0BSsKouQuwjGhkdGLhltzC6WeuquYeWbN9ezb2';

-- ============================================
-- END OF DATABASE SETUP
-- ============================================
-- All users default password: admin123
-- Database ready to use!
