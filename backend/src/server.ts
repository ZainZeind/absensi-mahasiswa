import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'absensi_kampus',
  port: Number(process.env.DB_PORT) || 3308,
};

let db: mysql.Pool;

// Initialize database connection
async function initDatabase() {
  try {
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
  res.json({ status: 'ok', message: 'Server is running' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

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

    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const jwtExpiry = process.env.JWT_EXPIRES_IN || '24h';
    const token = (jwt.sign as any)(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiry }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = (jwt.verify as any)(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    const [rows] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    const users = rows as any[];
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Start server
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);
