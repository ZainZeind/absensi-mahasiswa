-- Fix sesi_absensi table
USE absensi_kampus;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `sesi_absensi`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `sesi_absensi` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `kelas_id` int unsigned NOT NULL,
  `tanggal` date NOT NULL,
  `jam_mulai` time NOT NULL,
  `jam_selesai` time DEFAULT NULL,
  `materi` text,
  `status` enum('scheduled','active','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kelas` (`kelas_id`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_status` (`status`),
  CONSTRAINT `sesi_absensi_ibfk_1` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Table sesi_absensi recreated successfully' as status;
