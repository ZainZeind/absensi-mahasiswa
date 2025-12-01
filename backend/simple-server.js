const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absensi_kampus',
  port: 3308,
};

let db;

// Initialize database connection
async function initDatabase() {
  try {
    console.log('🔄 Attempting to connect to database...');
    db = mysql.createPool(dbConfig);
    await db.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('📡 Health check endpoint called');
  res.json({ status: 'ok', message: 'Server is running' });
});

// Simple login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('📡 Login endpoint called');
  try {
    const { username, password } = req.body;
    console.log('📝 Login attempt for username:', username);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Query user from database
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    console.log('👤 Found users:', rows.length);

    res.json({
      success: true,
      message: 'Login endpoint working',
      data: rows,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Start server
async function startServer() {
  console.log('🚀 Starting server...');
  await initDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);