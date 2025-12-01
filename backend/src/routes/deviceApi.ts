import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Import pool from main index - untuk sementara buat pool baru
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absensi_kampus',
  port: Number(process.env.DB_PORT) || 3308,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const router = Router();

/**
 * Face Recognition Device API
 * Endpoint khusus untuk device face recognition yang dipasang di kelas
 */

// ==================== DEVICE AUTHENTICATION ====================
// Device harus authenticate dengan token khusus
const deviceAuthMiddleware = async (req: Request, res: Response, next: any) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    
    if (!deviceToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Device token required' 
      });
    }

    // Verify device token
    const [devices]: any = await pool.query(
      'SELECT * FROM devices WHERE token = ? AND is_active = TRUE',
      [deviceToken]
    );

    if (devices.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive device' 
      });
    }

    req.body.device = devices[0];
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET ACTIVE SESSION ====================
// Device mendapatkan sesi aktif untuk ruangan tertentu
router.get('/active-session', deviceAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const device = req.body.device;
    
    // Get active session for this device's location
    const [sessions]: any = await pool.query(`
      SELECT 
        s.id,
        s.kelas_id,
        s.tanggal,
        s.jam_mulai as waktu_mulai,
        s.jam_selesai as waktu_selesai,
        s.status,
        k.nama as kelas_nama,
        k.ruang,
        mk.nama as matakuliah_nama,
        d.nama as dosen_nama
      FROM sesi_absensi s
      JOIN kelas k ON s.kelas_id = k.id
      JOIN mata_kuliah mk ON k.matkul_id = mk.id
      JOIN dosen d ON k.dosen_id = d.id
      WHERE s.status = 'active'
        AND k.ruang = ?
        AND DATE(s.tanggal) = CURDATE()
      ORDER BY s.jam_mulai DESC
      LIMIT 1
    `, [device.lokasi]);

    if (sessions.length === 0) {
      return res.json({ 
        success: true, 
        active: false,
        message: 'No active session in this room' 
      });
    }

    // Get enrolled students for this session
    const [students]: any = await pool.query(`
      SELECT 
        m.id,
        m.nim,
        m.nama,
        m.foto_wajah
      FROM enrollment e
      JOIN mahasiswa m ON e.mahasiswa_id = m.id
      WHERE e.kelas_id = ?
    `, [sessions[0].kelas_id]);

    res.json({ 
      success: true, 
      active: true,
      data: {
        session: sessions[0],
        enrolled_students: students
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SUBMIT ATTENDANCE (FROM DEVICE) ====================
// Device mengirim data absensi setelah face recognition berhasil
router.post('/submit-attendance', deviceAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const device = req.body.device;
    const { sesi_id, nim, confidence, foto_wajah_path } = req.body;

    if (!sesi_id || !nim) {
      return res.status(400).json({ 
        success: false, 
        message: 'sesi_id and nim are required' 
      });
    }

    // Verify session is active
    const [sessions]: any = await pool.query(
      'SELECT * FROM sesi_absensi WHERE id = ? AND status = ?',
      [sesi_id, 'active']
    );

    if (sessions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session not found or not active' 
      });
    }

    // Get mahasiswa by NIM
    const [mahasiswa]: any = await pool.query(
      'SELECT * FROM mahasiswa WHERE nim = ?',
      [nim]
    );

    if (mahasiswa.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    const mahasiswaId = mahasiswa[0].id;

    // Check if already attended
    const [existing]: any = await pool.query(
      'SELECT * FROM absensi WHERE sesi_id = ? AND mahasiswa_id = ?',
      [sesi_id, mahasiswaId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student already attended this session',
        data: existing[0]
      });
    }

    // Check if student is enrolled in this class
    const session = sessions[0];
    const [enrollment]: any = await pool.query(
      'SELECT * FROM enrollment WHERE kelas_id = ? AND mahasiswa_id = ?',
      [session.kelas_id, mahasiswaId]
    );

    if (enrollment.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student not enrolled in this class' 
      });
    }

    // Insert attendance record
    const [result]: any = await pool.query(
      `INSERT INTO absensi 
        (sesi_id, mahasiswa_id, status, metode, foto_wajah, device_id) 
       VALUES (?, ?, 'hadir', 'face_recognition_device', ?, ?)`,
      [sesi_id, mahasiswaId, foto_wajah_path, device.id]
    );

    res.json({ 
      success: true, 
      message: 'Attendance recorded successfully',
      data: {
        id: result.insertId,
        nim: nim,
        nama: mahasiswa[0].nama,
        waktu_absen: new Date(),
        confidence: confidence
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== GET ATTENDANCE STATS (REAL-TIME) ====================
// Device mendapatkan statistik absensi real-time untuk ditampilkan
router.get('/stats/:sesi_id', deviceAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { sesi_id } = req.params;

    // Get total enrolled students
    const [session]: any = await pool.query(
      'SELECT kelas_id FROM sesi_absensi WHERE id = ?',
      [sesi_id]
    );

    if (session.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const [totalEnrolled]: any = await pool.query(
      'SELECT COUNT(*) as total FROM enrollment WHERE kelas_id = ?',
      [session[0].kelas_id]
    );

    // Get total attended
    const [totalAttended]: any = await pool.query(
      'SELECT COUNT(*) as total FROM absensi WHERE sesi_id = ?',
      [sesi_id]
    );

    // Get recent attendances
    const [recentAttendances]: any = await pool.query(`
      SELECT 
        m.nim,
        m.nama,
        a.waktu_absen,
        a.metode
      FROM absensi a
      JOIN mahasiswa m ON a.mahasiswa_id = m.id
      WHERE a.sesi_id = ?
      ORDER BY a.waktu_absen DESC
      LIMIT 10
    `, [sesi_id]);

    res.json({ 
      success: true, 
      data: {
        total_enrolled: totalEnrolled[0].total,
        total_attended: totalAttended[0].total,
        percentage: Math.round((totalAttended[0].total / totalEnrolled[0].total) * 100) || 0,
        recent_attendances: recentAttendances
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DEVICE HEARTBEAT ====================
// Device mengirim heartbeat untuk monitoring
router.post('/heartbeat', deviceAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const device = req.body.device;
    
    // Update last heartbeat
    await pool.query(
      'UPDATE devices SET last_heartbeat = NOW(), updated_at = NOW() WHERE id = ?',
      [device.id]
    );

    res.json({ 
      success: true, 
      message: 'Heartbeat received',
      server_time: new Date()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
