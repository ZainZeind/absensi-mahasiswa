-- Data Dummy untuk Sistem Absensi Mahasiswa
-- Teknik Industri - Universitas Diponegoro

-- Hapus data lama jika ada
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE absensi;
TRUNCATE TABLE enrollment;
TRUNCATE TABLE sesi_absensi;
TRUNCATE TABLE kelas;
TRUNCATE TABLE mata_kuliah;
TRUNCATE TABLE mahasiswa;
TRUNCATE TABLE dosen;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. USERS (Login Accounts)
-- ============================================
-- Passwords: admin123, dosen123, mahasiswa123
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@admin.ac.id', '$2b$10$SgjWA14rboxZhltMpGX9ZOO7ZjH/XAZnxQicCnTdP.Pr/RObCFMfq', 'admin'),
('agussetiawan', 'agussetiawan@lecturer.ac.id', '$2b$10$NHxNPtsZcywnDBFiWPZtKOV8xO.I5rAYyAk2NtHu6ee7C12KvU/ei', 'dosen'),
('zainharist', 'zainharist@students.ac.id', '$2b$10$JdBHuZdE6kE90unYjdV62ut4Bipa.z.Bx7pAWw.mTsjlkNPUyefky', 'mahasiswa');

-- ============================================
-- 2. DOSEN
-- ============================================
INSERT INTO dosen (nidn, nama, email, nomor_hp, jurusan) VALUES
('0610108901', 'Prof. Agus Setiawan, S.T., M.T.', 'agussetiawan@lecturer.ac.id', '081234567890', 'Teknik Industri');

-- ============================================
-- 3. MAHASISWA TEKNIK INDUSTRI
-- ============================================
INSERT INTO mahasiswa (nim, nama, email, jurusan, semester) VALUES
('24060122140001', 'Zain Harist', 'zainharist@students.ac.id', 'Teknik Industri', 5),
('24060122140002', 'Aisyah Putri', 'aisyah@students.ac.id', 'Teknik Industri', 5),
('24060122140003', 'Budi Santoso', 'budi@students.ac.id', 'Teknik Industri', 5),
('24060122140004', 'Citra Dewi', 'citra@students.ac.id', 'Teknik Industri', 5),
('24060122140005', 'Dedi Kurniawan', 'dedi@students.ac.id', 'Teknik Industri', 5),
('24060122140006', 'Eka Wulandari', 'eka@students.ac.id', 'Teknik Industri', 5),
('24060122140007', 'Fajar Rahman', 'fajar@students.ac.id', 'Teknik Industri', 5),
('24060122140008', 'Gita Safitri', 'gita@students.ac.id', 'Teknik Industri', 5),
('24060122140009', 'Hendra Wijaya', 'hendra@students.ac.id', 'Teknik Industri', 5),
('24060122140010', 'Indah Permata', 'indah@students.ac.id', 'Teknik Industri', 5);

-- ============================================
-- 4. MATA KULIAH TEKNIK INDUSTRI (Semester 5)
-- ============================================
INSERT INTO mata_kuliah (kode, nama, sks, semester, jurusan) VALUES
('TI3001', 'Perancangan Sistem Kerja dan Ergonomi', 3, 5, 'Teknik Industri'),
('TI3002', 'Perencanaan dan Pengendalian Produksi', 3, 5, 'Teknik Industri'),
('TI3003', 'Sistem Informasi Manajemen', 3, 5, 'Teknik Industri'),
('TI3004', 'Pengendalian dan Penjaminan Kualitas', 3, 5, 'Teknik Industri'),
('TI3005', 'Perancangan Tata Letak Fasilitas', 3, 5, 'Teknik Industri'),
('TI3006', 'Riset Operasi Lanjut', 3, 5, 'Teknik Industri'),
('TI3007', 'Manajemen Rantai Pasok', 3, 5, 'Teknik Industri'),
('TI3008', 'Pemodelan dan Simulasi Sistem', 3, 5, 'Teknik Industri');

-- ============================================
-- 5. KELAS (Jadwal Kuliah)
-- ============================================
INSERT INTO kelas (nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, tahun_ajaran, semester) VALUES
('TI 5A', 1, 1, 'Senin', '08:00:00', '10:30:00', 'E301', 40, '2024/2025', 'Ganjil'),
('TI 5A', 2, 1, 'Selasa', '08:00:00', '10:30:00', 'E302', 40, '2024/2025', 'Ganjil'),
('TI 5A', 3, 1, 'Rabu', '08:00:00', '10:30:00', 'E303', 40, '2024/2025', 'Ganjil'),
('TI 5A', 4, 1, 'Kamis', '08:00:00', '10:30:00', 'E304', 40, '2024/2025', 'Ganjil'),
('TI 5A', 5, 1, 'Jumat', '08:00:00', '10:30:00', 'E305', 40, '2024/2025', 'Ganjil'),
('TI 5B', 6, 1, 'Senin', '13:00:00', '15:30:00', 'E306', 40, '2024/2025', 'Ganjil'),
('TI 5B', 7, 1, 'Selasa', '13:00:00', '15:30:00', 'E307', 40, '2024/2025', 'Ganjil'),
('TI 5B', 8, 1, 'Rabu', '13:00:00', '15:30:00', 'E308', 40, '2024/2025', 'Ganjil');

-- ============================================
-- 6. ENROLLMENT (Mahasiswa Terdaftar di Kelas)
-- ============================================
-- Daftarkan semua mahasiswa ke semua kelas TI 5A
INSERT INTO enrollment (kelas_id, mahasiswa_id) 
SELECT k.id, m.id 
FROM kelas k 
CROSS JOIN mahasiswa m 
WHERE k.nama = 'TI 5A' AND m.jurusan = 'Teknik Industri';

-- Daftarkan 5 mahasiswa pertama ke kelas TI 5B
INSERT INTO enrollment (kelas_id, mahasiswa_id) 
SELECT k.id, m.id 
FROM kelas k 
CROSS JOIN (SELECT id FROM mahasiswa WHERE jurusan = 'Teknik Industri' LIMIT 5) m 
WHERE k.nama = 'TI 5B';

-- ============================================
-- 7. SESI ABSENSI (Contoh untuk hari ini)
-- ============================================
INSERT INTO sesi_absensi (kelas_id, tanggal, jam_mulai, jam_selesai, materi, status) VALUES
(1, CURDATE(), '08:00:00', '10:30:00', 'Pengenalan Sistem Kerja dan Ergonomi', 'active'),
(2, CURDATE(), '08:00:00', '10:30:00', 'Konsep Dasar PPC', 'scheduled'),
(3, CURDATE() + INTERVAL 1 DAY, '08:00:00', '10:30:00', 'Sistem Informasi dalam Organisasi', 'scheduled');

-- ============================================
-- 8. CONTOH DATA ABSENSI
-- ============================================
-- Beberapa mahasiswa sudah absen di sesi pertama
INSERT INTO absensi (sesi_id, mahasiswa_id, status, metode_absensi, waktu_absen) VALUES
(1, 1, 'hadir', 'webcam', NOW()),
(1, 2, 'hadir', 'webcam', NOW() - INTERVAL 5 MINUTE),
(1, 3, 'hadir', 'webcam', NOW() - INTERVAL 10 MINUTE);

-- ============================================
-- SELESAI
-- ============================================
SELECT 'Data dummy berhasil di-insert!' as message;

-- Verifikasi data
SELECT 'Total Users:', COUNT(*) FROM users;
SELECT 'Total Dosen:', COUNT(*) FROM dosen;
SELECT 'Total Mahasiswa:', COUNT(*) FROM mahasiswa;
SELECT 'Total Mata Kuliah:', COUNT(*) FROM mata_kuliah;
SELECT 'Total Kelas:', COUNT(*) FROM kelas;
SELECT 'Total Enrollment:', COUNT(*) FROM enrollment;
SELECT 'Total Sesi Absensi:', COUNT(*) FROM sesi_absensi;
SELECT 'Total Absensi:', COUNT(*) FROM absensi;
