import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import deviceApiRouter from './routes/deviceApi';
import https from 'https';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Middleware
app.use(cors({
  origin: true,  // Allow all origins in development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Database Pool
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

// Test DB Connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// ==================== AUTH MIDDLEWARE ====================
interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ==================== ROUTES ====================

// Device API Routes (for face recognition devices)
app.use('/api/device', deviceApiRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password required' });
    }

    // Login dengan username ATAU email
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?', 
      [username, username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

// ==================== MAHASISWA ROUTES ====================
app.get('/api/mahasiswa', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mahasiswa ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM mahasiswa WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mahasiswa not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/mahasiswa', authMiddleware, async (req, res) => {
  try {
    const { nim, nama, email, jurusan, semester } = req.body;
    
    if (!nim || !nama || !email) {
      return res.status(400).json({ success: false, message: 'NIM, nama, dan email harus diisi' });
    }

    if (!email.endsWith('@students')) {
      return res.status(400).json({ success: false, message: 'Email mahasiswa harus berakhiran @students' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO mahasiswa (nim, nama, email, jurusan, semester) VALUES (?, ?, ?, ?, ?)',
      [nim, nama, email, jurusan, semester || 1]
    );
    res.json({ success: true, message: 'Mahasiswa berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'NIM atau email sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const { nim, nama, email, jurusan, semester } = req.body;
    
    if (email && !email.endsWith('@students')) {
      return res.status(400).json({ success: false, message: 'Email mahasiswa harus berakhiran @students' });
    }
    
    const [result]: any = await pool.query(
      'UPDATE mahasiswa SET nim = ?, nama = ?, email = ?, jurusan = ?, semester = ? WHERE id = ?',
      [nim, nama, email, jurusan, semester, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mahasiswa not found' });
    }
    
    res.json({ success: true, message: 'Mahasiswa berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM mahasiswa WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mahasiswa not found' });
    }
    res.json({ success: true, message: 'Mahasiswa berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DOSEN ROUTES ====================
app.get('/api/dosen', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM dosen ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/dosen/:id', authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM dosen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Dosen not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/dosen', authMiddleware, async (req, res) => {
  try {
    const { nidn, nama, email, nomor_hp, jurusan } = req.body;
    
    if (!nidn || !nama || !email) {
      return res.status(400).json({ success: false, message: 'NIDN, nama, dan email harus diisi' });
    }

    if (!email.endsWith('@lecturer')) {
      return res.status(400).json({ success: false, message: 'Email dosen harus berakhiran @lecturer' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO dosen (nidn, nama, email, nomor_hp, jurusan) VALUES (?, ?, ?, ?, ?)',
      [nidn, nama, email, nomor_hp, jurusan]
    );
    res.json({ success: true, message: 'Dosen berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'NIDN atau email sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/dosen/:id', authMiddleware, async (req, res) => {
  try {
    const { nidn, nama, email, nomor_hp, jurusan } = req.body;
    
    if (email && !email.endsWith('@lecturer')) {
      return res.status(400).json({ success: false, message: 'Email dosen harus berakhiran @lecturer' });
    }
    
    const [result]: any = await pool.query(
      'UPDATE dosen SET nidn = ?, nama = ?, email = ?, nomor_hp = ?, jurusan = ? WHERE id = ?',
      [nidn, nama, email, nomor_hp, jurusan, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Dosen not found' });
    }
    
    res.json({ success: true, message: 'Dosen berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/dosen/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM dosen WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Dosen not found' });
    }
    res.json({ success: true, message: 'Dosen berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MATA KULIAH ROUTES ====================
app.get('/api/matakuliah', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mata_kuliah ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/matakuliah/:id', authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM mata_kuliah WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/matakuliah', authMiddleware, async (req, res) => {
  try {
    const { kode, nama, sks, semester } = req.body;
    
    if (!kode || !nama || !sks) {
      return res.status(400).json({ success: false, message: 'Kode, nama, dan SKS harus diisi' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO mata_kuliah (kode, nama, sks, semester) VALUES (?, ?, ?, ?)',
      [kode, nama, sks, semester]
    );
    res.json({ success: true, message: 'Mata kuliah berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Kode mata kuliah sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/matakuliah/:id', authMiddleware, async (req, res) => {
  try {
    const { kode, nama, sks, semester } = req.body;
    const [result]: any = await pool.query(
      'UPDATE mata_kuliah SET kode = ?, nama = ?, sks = ?, semester = ? WHERE id = ?',
      [kode, nama, sks, semester, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah not found' });
    }
    
    res.json({ success: true, message: 'Mata kuliah berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/matakuliah/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM mata_kuliah WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Mata kuliah not found' });
    }
    res.json({ success: true, message: 'Mata kuliah berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== KELAS ROUTES ====================
app.get('/api/kelas', authMiddleware, async (req: any, res: Response) => {
  try {
    const { dosen_id } = req.query;
    console.log('GET /api/kelas - User role:', req.user?.role, 'User ID:', req.user?.id);
    
    let query = `
      SELECT k.*, 
        mk.nama as matakuliah_nama, mk.kode as matakuliah_kode, mk.sks, mk.semester,
        d.nama as dosen_nama, d.nidn as dosen_nidn, d.email as dosen_email, d.jurusan as dosen_jurusan
      FROM kelas k
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // Filter by dosen_id if query param provided (for dosen view)
    if (dosen_id) {
      query += ' AND k.dosen_id = ?';
      params.push(dosen_id);
      console.log('Filtering for dosen_id:', dosen_id);
    } else {
      console.log('No filter applied - returning all kelas');
    }
    
    query += ' ORDER BY k.created_at DESC';
    
    const [rows]: any = await pool.query(query, params);
    console.log('Found', rows.length, 'kelas records');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching kelas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/kelas/:id', authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT k.*, mk.nama as mata_kuliah_nama, mk.kode as mata_kuliah_kode, d.nama as dosen_nama
      FROM kelas k
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE k.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Kelas not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/kelas', authMiddleware, async (req, res) => {
  try {
    const { nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran } = req.body;
    
    console.log('Creating kelas with data:', { nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran });
    
    if (!nama || !matkul_id || !dosen_id || !hari || !jam_mulai || !jam_selesai || !ruang || !kapasitas || !semester || !tahun_ajaran) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO kelas (nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran]
    );
    
    console.log('Kelas created successfully, ID:', result.insertId);
    res.json({ success: true, message: 'Kelas berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    console.error('Error creating kelas:', error);
    res.status(500).json({ success: false, message: error.message, details: error.sqlMessage });
  }
});

app.put('/api/kelas/:id', authMiddleware, async (req, res) => {
  try {
    const { nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran } = req.body;
    const [result]: any = await pool.query(
      'UPDATE kelas SET nama = ?, matkul_id = ?, dosen_id = ?, hari = ?, jam_mulai = ?, jam_selesai = ?, ruang = ?, kapasitas = ?, semester = ?, tahun_ajaran = ? WHERE id = ?',
      [nama, matkul_id, dosen_id, hari, jam_mulai, jam_selesai, ruang, kapasitas, semester, tahun_ajaran, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kelas not found' });
    }
    
    res.json({ success: true, message: 'Kelas berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/kelas/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM kelas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Kelas not found' });
    }
    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ENROLLMENT ROUTES ====================
app.get('/api/enrollment', authMiddleware, async (req, res) => {
  try {
    const { kelas_id, mahasiswa_id } = req.query;
    let query = `
      SELECT e.*, 
        m.nim, m.nama as mahasiswa_nama, m.email as mahasiswa_email,
        k.nama as kelas_nama, k.hari, k.jam_mulai, k.jam_selesai, k.ruang,
        mk.nama as matakuliah_nama, mk.kode as matakuliah_kode, mk.sks,
        d.nama as dosen_nama, d.nidn as dosen_nidn
      FROM enrollment e
      LEFT JOIN mahasiswa m ON e.mahasiswa_id = m.id
      LEFT JOIN kelas k ON e.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (kelas_id) {
      query += ' AND e.kelas_id = ?';
      params.push(kelas_id);
    }
    if (mahasiswa_id) {
      query += ' AND e.mahasiswa_id = ?';
      params.push(mahasiswa_id);
    }
    
    query += ' ORDER BY e.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/enrollment', authMiddleware, async (req, res) => {
  try {
    const { kelas_id, mahasiswa_id } = req.body;
    
    if (!kelas_id || !mahasiswa_id) {
      return res.status(400).json({ success: false, message: 'Kelas dan mahasiswa harus diisi' });
    }

    // Check if already enrolled
    const [existing]: any = await pool.query(
      'SELECT id FROM enrollment WHERE kelas_id = ? AND mahasiswa_id = ?',
      [kelas_id, mahasiswa_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Mahasiswa sudah terdaftar di kelas ini' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO enrollment (kelas_id, mahasiswa_id) VALUES (?, ?)',
      [kelas_id, mahasiswa_id]
    );
    res.json({ success: true, message: 'Mahasiswa berhasil didaftarkan', data: { id: result.insertId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/enrollment/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM enrollment WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }
    res.json({ success: true, message: 'Enrollment berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SESI ABSENSI ROUTES ====================
app.get('/api/sesi', authMiddleware, async (req, res) => {
  try {
    const { kelas_id } = req.query;
    let query = `
      SELECT s.*, 
        k.nama as kelas_nama, k.ruang, k.hari, k.jam_mulai as kelas_jam_mulai, k.jam_selesai as kelas_jam_selesai,
        mk.nama as matakuliah_nama, mk.kode as matakuliah_kode, mk.sks,
        d.nama as dosen_nama, d.nidn as dosen_nidn, d.email as dosen_email,
        (SELECT COUNT(*) FROM absensi a WHERE a.sesi_id = s.id AND a.status = 'hadir') as total_hadir,
        (SELECT COUNT(*) FROM enrollment e WHERE e.kelas_id = s.kelas_id) as total_mahasiswa
      FROM sesi_absensi s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (kelas_id) {
      query += ' AND s.kelas_id = ?';
      params.push(kelas_id);
    }
    
    query += ' ORDER BY s.tanggal DESC, s.jam_mulai DESC';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/sesi/:id', authMiddleware, async (req, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT s.*, 
        k.nama as kelas_nama, k.ruang, k.hari,
        mk.nama as matakuliah_nama, mk.kode as matakuliah_kode, mk.sks,
        d.nama as dosen_nama, d.nidn as dosen_nidn, d.email as dosen_email,
        (SELECT COUNT(*) FROM absensi a WHERE a.sesi_id = s.id AND a.status = 'hadir') as total_hadir,
        (SELECT COUNT(*) FROM enrollment e WHERE e.kelas_id = s.kelas_id) as total_mahasiswa
      FROM sesi_absensi s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sesi not found' });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/sesi', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { kelas_id, tanggal, jam_mulai, jam_selesai, materi, status } = req.body;
    
    console.log('POST /api/sesi - Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user);
    
    // Test: Cek struktur tabel dan database
    try {
      const [dbInfo]: any = await pool.query("SELECT DATABASE() as db");
      console.log('Connected to database:', dbInfo[0].db);
      
      const [columns]: any = await pool.query("SHOW COLUMNS FROM sesi_absensi");
      console.log('Table columns:', columns.map((c: any) => c.Field).join(', '));
      
      const [tableInfo]: any = await pool.query("SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'sesi_absensi'");
      console.log('Table info:', tableInfo);
    } catch (e: any) {
      console.error('Error checking table structure:', e.message);
    }
    
    if (!kelas_id || !tanggal || !jam_mulai) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({ success: false, message: 'Kelas, tanggal, dan jam mulai harus diisi' });
    }

    // Validate kelas exists
    console.log('Checking if kelas exists:', kelas_id);
    const [kelasCheck]: any = await pool.query('SELECT id FROM kelas WHERE id = ?', [kelas_id]);
    console.log('Kelas check result:', kelasCheck);
    
    if (kelasCheck.length === 0) {
      console.log('Kelas not found');
      return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan. Pastikan kelas sudah dibuat terlebih dahulu.' });
    }

    // Set default jam_selesai if not provided (2 hours after jam_mulai)
    let finalJamSelesai = jam_selesai;
    if (!finalJamSelesai && jam_mulai) {
      const [hours, minutes] = jam_mulai.split(':').map(Number);
      const endHours = (hours + 2) % 24;
      finalJamSelesai = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      console.log('Auto-generated jam_selesai:', finalJamSelesai);
    }

    console.log('Inserting sesi with:', { kelas_id, tanggal, jam_mulai, jam_selesai: finalJamSelesai, materi, status: status || 'scheduled' });
    
    const [result]: any = await pool.query(
      'INSERT INTO `sesi_absensi` (`kelas_id`, `tanggal`, `jam_mulai`, `jam_selesai`, `materi`, `status`) VALUES (?, ?, ?, ?, ?, ?)',
      [kelas_id, tanggal, jam_mulai, finalJamSelesai || null, materi || null, status || 'scheduled']
    );
    
    console.log('✅ Sesi created successfully, ID:', result.insertId);
    res.json({ success: true, message: 'Sesi absensi berhasil dibuat', data: { id: result.insertId } });
  } catch (error: any) {
    console.error('❌ Error creating sesi:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message, 
      details: error.sqlMessage || error.toString(),
      code: error.code 
    });
  }
});

app.put('/api/sesi/:id', authMiddleware, async (req, res) => {
  try {
    const { tanggal, jam_mulai, jam_selesai, materi, status } = req.body;
    const [result]: any = await pool.query(
      'UPDATE sesi_absensi SET tanggal = ?, jam_mulai = ?, jam_selesai = ?, materi = ?, status = ? WHERE id = ?',
      [tanggal, jam_mulai, jam_selesai, materi, status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sesi not found' });
    }
    
    res.json({ success: true, message: 'Sesi berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/sesi/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM sesi_absensi WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sesi not found' });
    }
    res.json({ success: true, message: 'Sesi berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activate/Deactivate session status
app.put('/api/sesi/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['scheduled', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status harus salah satu: scheduled, active, completed, cancelled' 
      });
    }

    const [result]: any = await pool.query(
      'UPDATE sesi_absensi SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sesi not found' });
    }
    
    res.json({ 
      success: true, 
      message: `Sesi berhasil diubah menjadi ${status}`,
      data: { id: req.params.id, status }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ABSENSI ROUTES ====================
app.get('/api/absensi', authMiddleware, async (req, res) => {
  try {
    const { sesi_id, mahasiswa_id } = req.query;
    let query = `
      SELECT a.*, 
        m.nim, m.nama as mahasiswa_nama, m.email as mahasiswa_email,
        s.tanggal, s.jam_mulai, s.jam_selesai, s.materi,
        k.nama as kelas_nama, k.ruang,
        mk.nama as matakuliah_nama, mk.kode as matakuliah_kode, mk.sks,
        d.nama as dosen_nama, d.nidn as dosen_nidn
      FROM absensi a
      LEFT JOIN mahasiswa m ON a.mahasiswa_id = m.id
      LEFT JOIN sesi_absensi s ON a.sesi_id = s.id
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (sesi_id) {
      query += ' AND a.sesi_id = ?';
      params.push(sesi_id);
    }
    if (mahasiswa_id) {
      query += ' AND a.mahasiswa_id = ?';
      params.push(mahasiswa_id);
    }
    
    query += ' ORDER BY a.waktu_absen DESC';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/absensi', authMiddleware, async (req, res) => {
  try {
    const { sesi_id, mahasiswa_id, nim, status, device_id, lokasi, catatan, metode } = req.body;
    
    console.log('POST /api/absensi - Body:', req.body);
    
    let finalMahasiswaId = mahasiswa_id;
    
    // If NIM is provided instead of mahasiswa_id, lookup the ID
    if (!mahasiswa_id && nim) {
      console.log('Looking up mahasiswa by NIM:', nim);
      const [mahasiswaResult]: any = await pool.query(
        'SELECT id FROM mahasiswa WHERE nim = ?',
        [nim]
      );
      
      if (mahasiswaResult.length === 0) {
        console.log('Mahasiswa not found for NIM:', nim);
        return res.status(404).json({ success: false, message: 'Mahasiswa dengan NIM tersebut tidak ditemukan' });
      }
      
      finalMahasiswaId = mahasiswaResult[0].id;
      console.log('Found mahasiswa_id:', finalMahasiswaId);
    }
    
    console.log('Validation - sesi_id:', sesi_id, 'mahasiswa_id:', finalMahasiswaId, 'status:', status);
    
    if (!sesi_id || !finalMahasiswaId || !status) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Sesi, mahasiswa, dan status harus diisi',
        debug: { sesi_id, mahasiswa_id: finalMahasiswaId, status }
      });
    }

    // Check if already submitted
    const [existing]: any = await pool.query(
      'SELECT id FROM absensi WHERE sesi_id = ? AND mahasiswa_id = ?',
      [sesi_id, finalMahasiswaId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Absensi sudah tercatat' });
    }

    const absensiMetode = metode || 'webcam'; // Default to webcam if not specified

    const [result]: any = await pool.query(
      'INSERT INTO absensi (sesi_id, mahasiswa_id, status, metode_absensi, waktu_absen, catatan) VALUES (?, ?, ?, ?, NOW(), ?)',
      [sesi_id, finalMahasiswaId, status, absensiMetode, catatan]
    );
    res.json({ success: true, message: 'Absensi berhasil tercatat', data: { id: result.insertId, metode: absensiMetode } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/absensi/:id', authMiddleware, async (req, res) => {
  try {
    const { status, catatan } = req.body;
    const [result]: any = await pool.query(
      'UPDATE absensi SET status = ?, catatan = ? WHERE id = ?',
      [status, catatan, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Absensi not found' });
    }
    
    res.json({ success: true, message: 'Absensi berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DEVICE ROUTES ====================
app.get('/api/device', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/device', authMiddleware, async (req, res) => {
  try {
    const { device_id, nama, lokasi, status } = req.body;
    
    if (!device_id || !nama) {
      return res.status(400).json({ success: false, message: 'Device ID dan nama harus diisi' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO devices (device_id, nama, lokasi, status) VALUES (?, ?, ?, ?)',
      [device_id, nama, lokasi, status || 'aktif']
    );
    res.json({ success: true, message: 'Device berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Device ID sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/device/:id', authMiddleware, async (req, res) => {
  try {
    const { nama, lokasi, status } = req.body;
    const [result]: any = await pool.query(
      'UPDATE devices SET nama = ?, lokasi = ?, status = ? WHERE id = ?',
      [nama, lokasi, status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    res.json({ success: true, message: 'Device berhasil diupdate' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/device/:id', authMiddleware, async (req, res) => {
  try {
    const [result]: any = await pool.query('DELETE FROM devices WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, message: 'Device berhasil dihapus' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== REPORT ROUTES ====================
app.get('/api/report/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.nim, m.nama,
        k.nama as kelas_nama,
        mk.nama as mata_kuliah_nama,
        COUNT(DISTINCT s.id) as total_pertemuan,
        COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.id END) as total_hadir,
        COUNT(DISTINCT CASE WHEN a.status = 'izin' THEN a.id END) as total_izin,
        COUNT(DISTINCT CASE WHEN a.status = 'sakit' THEN a.id END) as total_sakit,
        COUNT(DISTINCT CASE WHEN a.status = 'alpha' OR a.id IS NULL THEN s.id END) as total_alpha,
        ROUND((COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.id END) / COUNT(DISTINCT s.id)) * 100, 2) as persentase_kehadiran
      FROM mahasiswa m
      LEFT JOIN enrollment e ON m.id = e.mahasiswa_id
      LEFT JOIN kelas k ON e.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN sesi_absensi s ON k.id = s.kelas_id
      LEFT JOIN absensi a ON s.id = a.sesi_id AND m.id = a.mahasiswa_id
      WHERE m.id = ?
      GROUP BY m.id, k.id, mk.id
    `, [req.params.id]);
    
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/report/kelas/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.nim, m.nama as mahasiswa_nama,
        COUNT(DISTINCT s.id) as total_pertemuan,
        COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.id END) as total_hadir,
        COUNT(DISTINCT CASE WHEN a.status = 'izin' THEN a.id END) as total_izin,
        COUNT(DISTINCT CASE WHEN a.status = 'sakit' THEN a.id END) as total_sakit,
        COUNT(DISTINCT CASE WHEN a.status = 'alpha' OR a.id IS NULL THEN s.id END) as total_alpha,
        ROUND((COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.id END) / COUNT(DISTINCT s.id)) * 100, 2) as persentase_kehadiran
      FROM enrollment e
      JOIN mahasiswa m ON e.mahasiswa_id = m.id
      LEFT JOIN sesi_absensi s ON e.kelas_id = s.kelas_id
      LEFT JOIN absensi a ON s.id = a.sesi_id AND m.id = a.mahasiswa_id
      WHERE e.kelas_id = ?
      GROUP BY m.id
      ORDER BY m.nama
    `, [req.params.id]);
    
    res.json({ success: true, data: rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/stats/admin', authMiddleware, async (req, res) => {
  try {
    const [mahasiswa]: any = await pool.query('SELECT COUNT(*) as total FROM mahasiswa');
    const [dosen]: any = await pool.query('SELECT COUNT(*) as total FROM dosen');
    const [kelas]: any = await pool.query('SELECT COUNT(*) as total FROM kelas');
    const [matakuliah]: any = await pool.query('SELECT COUNT(*) as total FROM mata_kuliah');
    const [sesiToday]: any = await pool.query('SELECT COUNT(*) as total FROM sesi_absensi WHERE tanggal = CURDATE()');
    
    res.json({
      success: true,
      data: {
        total_mahasiswa: mahasiswa[0].total,
        total_dosen: dosen[0].total,
        total_kelas: kelas[0].total,
        total_matakuliah: matakuliah[0].total,
        sesi_hari_ini: sesiToday[0].total
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/stats/dosen/:id', authMiddleware, async (req, res) => {
  try {
    const [kelas]: any = await pool.query('SELECT COUNT(*) as total FROM kelas WHERE dosen_id = (SELECT id FROM dosen WHERE user_id = ?)', [req.params.id]);
    const [mahasiswa]: any = await pool.query(`
      SELECT COUNT(DISTINCT e.mahasiswa_id) as total 
      FROM enrollment e 
      JOIN kelas k ON e.kelas_id = k.id 
      WHERE k.dosen_id = (SELECT id FROM dosen WHERE user_id = ?)
    `, [req.params.id]);
    
    res.json({
      success: true,
      data: {
        total_kelas: kelas[0].total,
        total_mahasiswa: mahasiswa[0].total
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/stats/mahasiswa/:id', authMiddleware, async (req, res) => {
  try {
    const [kelas]: any = await pool.query(`
      SELECT COUNT(*) as total FROM enrollment 
      WHERE mahasiswa_id = (SELECT id FROM mahasiswa WHERE user_id = ?)
    `, [req.params.id]);
    
    const [kehadiran]: any = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_pertemuan,
        COUNT(DISTINCT CASE WHEN a.status = 'hadir' THEN a.id END) as total_hadir
      FROM mahasiswa m
      LEFT JOIN enrollment e ON m.id = e.mahasiswa_id
      LEFT JOIN sesi_absensi s ON e.kelas_id = s.kelas_id
      LEFT JOIN absensi a ON s.id = a.sesi_id AND m.id = a.mahasiswa_id
      WHERE m.user_id = ?
    `, [req.params.id]);
    
    const persentase = kehadiran[0].total_pertemuan > 0 
      ? ((kehadiran[0].total_hadir / kehadiran[0].total_pertemuan) * 100).toFixed(2)
      : 0;
    
    res.json({
      success: true,
      data: {
        total_kelas: kelas[0].total,
        total_pertemuan: kehadiran[0].total_pertemuan,
        total_hadir: kehadiran[0].total_hadir,
        persentase_kehadiran: persentase
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== FACE RECOGNITION DEVICE API ====================
// Device Authentication Middleware
const deviceAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceToken = req.headers['x-device-token'];
    
    if (!deviceToken) {
      return res.status(401).json({ success: false, message: 'Device token required' });
    }

    const [devices]: any = await pool.query(
      'SELECT * FROM devices WHERE token = ? AND is_active = TRUE',
      [deviceToken]
    );

    if (devices.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive device' });
    }

    req.user = devices[0]; // Store device info in request
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active session for device location
app.get('/api/device/active-session', deviceAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const device = req.user;
    
    const [sessions]: any = await pool.query(`
      SELECT 
        s.id,
        s.kelas_id,
        s.tanggal,
        s.jam_mulai as waktu_mulai,
        s.jam_selesai as waktu_selesai,
        s.status,
        k.nama as kelas_nama,
        k.ruangan,
        mk.nama as matakuliah_nama,
        d.nama as dosen_nama
      FROM sesi_absensi s
      JOIN kelas k ON s.kelas_id = k.id
      JOIN mata_kuliah mk ON k.matakuliah_id = mk.id
      JOIN dosen d ON k.dosen_id = d.id
      WHERE s.status = 'active'
        AND DATE(s.tanggal) = CURDATE()
      ORDER BY s.jam_mulai DESC
      LIMIT 1
    `);

    if (sessions.length === 0) {
      return res.json({ success: true, active: false, message: 'No active session' });
    }

    const [students]: any = await pool.query(`
      SELECT m.id, m.nim, m.nama, m.foto_wajah
      FROM enrollment e
      JOIN mahasiswa m ON e.mahasiswa_id = m.id
      WHERE e.kelas_id = ?
    `, [sessions[0].kelas_id]);

    res.json({ success: true, active: true, data: { session: sessions[0], enrolled_students: students } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit attendance from device
app.post('/api/device/submit-attendance', deviceAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const device = req.user;
    const { sesi_id, nim, confidence, foto_wajah_path } = req.body;

    if (!sesi_id || !nim) {
      return res.status(400).json({ success: false, message: 'sesi_id and nim are required' });
    }

    const [sessions]: any = await pool.query(
      'SELECT * FROM sesi_absensi WHERE id = ? AND status = ?',
      [sesi_id, 'active']
    );

    if (sessions.length === 0) {
      return res.status(400).json({ success: false, message: 'Session not active' });
    }

    const [mahasiswa]: any = await pool.query('SELECT * FROM mahasiswa WHERE nim = ?', [nim]);
    if (mahasiswa.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const mahasiswaId = mahasiswa[0].id;

    const [existing]: any = await pool.query(
      'SELECT * FROM absensi WHERE sesi_absensi_id = ? AND mahasiswa_id = ?',
      [sesi_id, mahasiswaId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Already attended' });
    }

    const [result]: any = await pool.query(
      `INSERT INTO absensi (sesi_absensi_id, mahasiswa_id, status, metode, confidence, foto_wajah, device_id) 
       VALUES (?, ?, 'hadir', 'face_recognition_device', ?, ?, ?)`,
      [sesi_id, mahasiswaId, confidence || 0.95, foto_wajah_path, device.id]
    );

    res.json({ 
      success: true, 
      message: 'Attendance recorded',
      data: { id: result.insertId, nim, nama: mahasiswa[0].nama, waktu_absen: new Date() }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get real-time attendance stats
app.get('/api/device/stats/:sesi_id', deviceAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sesi_id } = req.params;

    const [session]: any = await pool.query('SELECT kelas_id FROM sesi_absensi WHERE id = ?', [sesi_id]);
    if (session.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const [totalEnrolled]: any = await pool.query(
      'SELECT COUNT(*) as total FROM enrollment WHERE kelas_id = ?',
      [session[0].kelas_id]
    );

    const [totalAttended]: any = await pool.query(
      'SELECT COUNT(*) as total FROM absensi WHERE sesi_absensi_id = ?',
      [sesi_id]
    );

    const [recentAttendances]: any = await pool.query(`
      SELECT m.nim, m.nama, a.waktu_absen, a.confidence, a.metode
      FROM absensi a
      JOIN mahasiswa m ON a.mahasiswa_id = m.id
      WHERE a.sesi_absensi_id = ?
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

// Device heartbeat
app.post('/api/device/heartbeat', deviceAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const device = req.user;
    await pool.query('UPDATE devices SET last_seen = NOW() WHERE id = ?', [device.id]);
    res.json({ success: true, message: 'Heartbeat received', server_time: new Date() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ERROR HANDLER ====================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start Server
if (USE_HTTPS) {
  // Create self-signed certificate directory if not exists
  const certDir = path.join(__dirname, '..', 'ssl');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  const certPath = path.join(certDir, 'cert.pem');
  const keyPath = path.join(certDir, 'key.pem');

  // Check if certificates exist
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`🚀 Server running on https://localhost:${PORT}`);
      console.log(`📡 API: https://localhost:${PORT}/api`);
      console.log('🔒 HTTPS enabled');
    });
  } else {
    console.error('❌ SSL certificates not found!');
    console.log('Generate certificates with:');
    console.log(`openssl req -nodes -new -x509 -keyout ${keyPath} -out ${certPath} -days 365`);
    process.exit(1);
  }
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
}

export default app;
