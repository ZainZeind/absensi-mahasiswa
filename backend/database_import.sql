-- Import tables one by one
USE absensi_kampus;

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

-- Table enrollment
CREATE TABLE IF NOT EXISTS enrollment (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mahasiswa_id INT UNSIGNED NOT NULL,
    kelas_id INT UNSIGNED NOT NULL,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('aktif', 'nonaktif', 'lulus', 'mengundurkan_diri') NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY unique_mahasiswa_kelas (mahasiswa_id, kelas_id),
    INDEX idx_status (status)
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
    dosen_id INT UNSIGNED NOT NULL,
    device_id INT UNSIGNED NULL,
    judul_sesi VARCHAR(200) NOT NULL,
    waktu_mulai TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_selesai TIMESTAMP NULL,
    durasi_menit INT NOT NULL DEFAULT 15 CHECK (durasi_menit >= 1 AND durasi_menit <= 180),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    kode_sesi VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_kelas_dosen (kelas_id, dosen_id),
    INDEX idx_kode_sesi (kode_sesi),
    INDEX idx_waktu_mulai (waktu_mulai),
    INDEX idx_is_active (is_active)
);

-- Table absensi
CREATE TABLE IF NOT EXISTS absensi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sesi_id INT UNSIGNED NOT NULL,
    mahasiswa_id INT UNSIGNED NOT NULL,
    kelas_id INT UNSIGNED NOT NULL,
    tanggal DATE NOT NULL,
    jam_masuk TIME NULL,
    status ENUM('Hadir', 'Tidak Hadir', 'Izin', 'Sakit') NOT NULL DEFAULT 'Tidak Hadir',
    foto_absensi VARCHAR(255) NULL,
    keterangan TEXT NULL,
    face_confidence FLOAT NULL,
    device_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (sesi_id) REFERENCES sesi_absensi(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL ON UPDATE CASCADE,

    UNIQUE KEY unique_sesi_mahasiswa (sesi_id, mahasiswa_id),
    INDEX idx_tanggal (tanggal),
    INDEX idx_status (status),
    INDEX idx_mahasiswa_kelas (mahasiswa_id, kelas_id)
);
