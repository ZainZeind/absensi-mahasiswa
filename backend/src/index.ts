import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const [rows]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
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
app.get('/api/kelas', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT k.*, mk.nama as mata_kuliah_nama, mk.kode as mata_kuliah_kode, d.nama as dosen_nama
      FROM kelas k
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
      LEFT JOIN dosen d ON k.dosen_id = d.id
      ORDER BY k.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error: any) {
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
    const { kode, nama, matkul_id, dosen_id, semester, tahun_ajaran, ruangan, jadwal } = req.body;
    
    if (!kode || !nama || !matkul_id || !dosen_id) {
      return res.status(400).json({ success: false, message: 'Kode, nama, mata kuliah, dan dosen harus diisi' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO kelas (kode, nama, matkul_id, dosen_id, semester, tahun_ajaran, ruangan, jadwal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [kode, nama, matkul_id, dosen_id, semester, tahun_ajaran, ruangan, jadwal]
    );
    res.json({ success: true, message: 'Kelas berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Kode kelas sudah terdaftar' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/kelas/:id', authMiddleware, async (req, res) => {
  try {
    const { kode, nama, matkul_id, dosen_id, semester, tahun_ajaran, ruangan, jadwal } = req.body;
    const [result]: any = await pool.query(
      'UPDATE kelas SET kode = ?, nama = ?, matkul_id = ?, dosen_id = ?, semester = ?, tahun_ajaran = ?, ruangan = ?, jadwal = ? WHERE id = ?',
      [kode, nama, matkul_id, dosen_id, semester, tahun_ajaran, ruangan, jadwal, req.params.id]
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
      SELECT e.*, m.nim, m.nama as mahasiswa_nama, k.nama as kelas_nama, mk.nama as mata_kuliah_nama
      FROM enrollment e
      LEFT JOIN mahasiswa m ON e.mahasiswa_id = m.id
      LEFT JOIN kelas k ON e.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
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
      SELECT s.*, k.nama as kelas_nama, mk.nama as mata_kuliah_nama, d.nama as dosen_nama
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
      SELECT s.*, k.nama as kelas_nama, mk.nama as mata_kuliah_nama
      FROM sesi_absensi s
      LEFT JOIN kelas k ON s.kelas_id = k.id
      LEFT JOIN mata_kuliah mk ON k.matkul_id = mk.id
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

app.post('/api/sesi', authMiddleware, async (req, res) => {
  try {
    const { kelas_id, tanggal, jam_mulai, jam_selesai, materi, status } = req.body;
    
    if (!kelas_id || !tanggal || !jam_mulai) {
      return res.status(400).json({ success: false, message: 'Kelas, tanggal, dan jam mulai harus diisi' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO sesi_absensi (kelas_id, tanggal, jam_mulai, jam_selesai, materi, status) VALUES (?, ?, ?, ?, ?, ?)',
      [kelas_id, tanggal, jam_mulai, jam_selesai, materi, status || 'aktif']
    );
    res.json({ success: true, message: 'Sesi absensi berhasil dibuat', data: { id: result.insertId } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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

// ==================== ABSENSI ROUTES ====================
app.get('/api/absensi', authMiddleware, async (req, res) => {
  try {
    const { sesi_id, mahasiswa_id } = req.query;
    let query = `
      SELECT a.*, m.nim, m.nama as mahasiswa_nama, s.tanggal, k.nama as kelas_nama
      FROM absensi a
      LEFT JOIN mahasiswa m ON a.mahasiswa_id = m.id
      LEFT JOIN sesi_absensi s ON a.sesi_id = s.id
      LEFT JOIN kelas k ON s.kelas_id = k.id
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
    const { sesi_id, mahasiswa_id, status, device_id, lokasi, catatan } = req.body;
    
    if (!sesi_id || !mahasiswa_id || !status) {
      return res.status(400).json({ success: false, message: 'Sesi, mahasiswa, dan status harus diisi' });
    }

    // Check if already submitted
    const [existing]: any = await pool.query(
      'SELECT id FROM absensi WHERE sesi_id = ? AND mahasiswa_id = ?',
      [sesi_id, mahasiswa_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Absensi sudah tercatat' });
    }

    const [result]: any = await pool.query(
      'INSERT INTO absensi (sesi_id, mahasiswa_id, status, waktu_absen, device_id, lokasi, catatan) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
      [sesi_id, mahasiswa_id, status, device_id, lokasi, catatan]
    );
    res.json({ success: true, message: 'Absensi berhasil tercatat', data: { id: result.insertId } });
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});

export default app;
