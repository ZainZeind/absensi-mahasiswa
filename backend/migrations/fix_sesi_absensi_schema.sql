-- Migration: Fix sesi_absensi and absensi schema to match implementation
-- Date: 2024-12-02

-- Drop old sesi_absensi table if exists and recreate with correct schema
DROP TABLE IF EXISTS absensi;
DROP TABLE IF EXISTS sesi_absensi;

-- Recreate sesi_absensi with correct fields
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

-- Recreate absensi with correct fields
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
