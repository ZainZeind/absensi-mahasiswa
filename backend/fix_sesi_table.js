const mysql = require('mysql2/promise');

async function fixTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'absensi_kampus',
    port: 3308
  });

  try {
    console.log('Checking kelas table...');
    const [kelasInfo] = await connection.query('SHOW CREATE TABLE kelas');
    console.log('Kelas table:', kelasInfo[0]['Create Table']);
    
    console.log('\nDropping dependent tables...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS absensi');
    await connection.query('DROP TABLE IF EXISTS sesi_absensi');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Creating new table...');
    await connection.query(`
      CREATE TABLE sesi_absensi (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        kelas_id INT UNSIGNED NOT NULL,
        tanggal DATE NOT NULL,
        jam_mulai TIME NOT NULL,
        jam_selesai TIME,
        materi TEXT,
        status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Recreating absensi table...');
    await connection.query(`
      CREATE TABLE absensi (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        sesi_id INT UNSIGNED NOT NULL,
        mahasiswa_id INT UNSIGNED NOT NULL,
        status ENUM('hadir', 'tidak_hadir', 'izin', 'sakit') NOT NULL,
        waktu_absen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metode_absensi ENUM('manual', 'face_recognition', 'webcam') DEFAULT 'manual',
        catatan TEXT,
        FOREIGN KEY (sesi_id) REFERENCES sesi_absensi(id) ON DELETE CASCADE,
        FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (sesi_id, mahasiswa_id)
      )
    `);
    
    console.log('Verifying structure...');
    const [columns] = await connection.query('SHOW COLUMNS FROM sesi_absensi');
    console.log('Columns:', columns.map(c => c.Field).join(', '));
    
    console.log('✅ Tables fixed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixTable();
