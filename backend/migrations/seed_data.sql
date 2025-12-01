-- Seed data for testing
USE absensi_kampus;

-- Insert dosen (if not exists)
INSERT INTO dosen (nidn, nama, email, jurusan) VALUES
('123456789', 'Dr. Ahmad Fauzi', 'ahmad.fauzi@lecturer', 'Teknik Informatika')
ON DUPLICATE KEY UPDATE nidn=nidn;

-- Insert mata kuliah
INSERT INTO mata_kuliah (kode, nama, sks, semester, jurusan) VALUES
('IF101', 'Pemrograman Web', 3, 3, 'Teknik Informatika'),
('IF102', 'Algoritma dan Struktur Data', 4, 2, 'Teknik Informatika'),
('IF103', 'Basis Data', 3, 4, 'Teknik Informatika')
ON DUPLICATE KEY UPDATE kode=kode;

-- Get dosen_id
SET @dosen_id = (SELECT id FROM dosen WHERE email = 'ahmad.fauzi@lecturer' LIMIT 1);

-- Insert user for dosen (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('dosen1', 'ahmad.fauzi@lecturer', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'dosen')
ON DUPLICATE KEY UPDATE password='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO';

-- Insert kelas
INSERT INTO kelas (nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, tahun_ajaran, semester) VALUES
('Kelas A', 1, @dosen_id, 'Senin', '08:00', '10:00', 'A301', 40, '2024/2025', 'Ganjil'),
('Kelas B', 2, @dosen_id, 'Selasa', '10:00', '12:00', 'A302', 40, '2024/2025', 'Ganjil'),
('Kelas C', 3, @dosen_id, 'Rabu', '13:00', '15:00', 'B201', 35, '2024/2025', 'Ganjil')
ON DUPLICATE KEY UPDATE nama=nama;

-- Insert mahasiswa
INSERT INTO mahasiswa (nim, nama, email, jurusan, semester) VALUES
('2021010001', 'Budi Santoso', 'budi@students', 'Teknik Informatika', 5),
('2021010002', 'Ani Wijaya', 'ani@students', 'Teknik Informatika', 5),
('2021010003', 'Citra Dewi', 'citra@students', 'Teknik Informatika', 3)
ON DUPLICATE KEY UPDATE nim=nim;

-- Insert users for mahasiswa (password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('mhs1', 'budi@students', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'mahasiswa'),
('mhs2', 'ani@students', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'mahasiswa'),
('mhs3', 'citra@students', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO', 'mahasiswa')
ON DUPLICATE KEY UPDATE password='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDjO';

SELECT 'Seed data inserted successfully!' as status;
SELECT 'Login credentials - username: admin/dosen1/mhs1, password: admin123' as info;
