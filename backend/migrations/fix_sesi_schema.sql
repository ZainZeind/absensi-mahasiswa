-- Migration: Complete database recreation
-- Date: 2025-12-02
-- Description: Drop and recreate database with correct schema
-- WARNING: This will delete ALL existing data!

DROP DATABASE IF EXISTS absensi_kampus;
CREATE DATABASE absensi_kampus;
USE absensi_kampus;

-- Table users
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'dosen', 'mahasiswa') NOT NULL DEFAULT 'mahasiswa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Table mahasiswa
CREATE TABLE mahasiswa (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    nim VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    jurusan VARCHAR(100) NOT NULL,
    angkatan INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_nim (nim),
    INDEX idx_nama (nama),
    INDEX idx_jurusan (jurusan)
);

-- Table dosen
CREATE TABLE dosen (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    nip VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_nip (nip),
    INDEX idx_nama (nama)
);

-- Table mata_kuliah
CREATE TABLE mata_kuliah (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    sks INT NOT NULL CHECK (sks >= 1 AND sks <= 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kode (kode),
    INDEX idx_nama (nama)
);

-- Table kelas
CREATE TABLE kelas (
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

-- Table enrollment
CREATE TABLE enrollment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kelas_id INT UNSIGNED NOT NULL,
    mahasiswa_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_enrollment (kelas_id, mahasiswa_id),
    INDEX idx_kelas (kelas_id),
    INDEX idx_mahasiswa (mahasiswa_id)
);

-- Table sesi_absensi
CREATE TABLE sesi_absensi (
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

-- Table absensi
CREATE TABLE absensi (
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

-- Insert default admin user
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'admin');

SELECT 'Database recreated successfully!' as message;
