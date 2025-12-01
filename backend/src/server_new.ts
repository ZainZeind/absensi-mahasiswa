import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models'; // Adjust path as needed
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import mahasiswaRoutes from './routes/mahasiswa';
import dosenRoutes from './routes/dosen';
import mataKuliahRoutes from './routes/mata-kuliah';
import kelasRoutes from './routes/kelas';
import enrollmentRoutes from './routes/enrollment';
import deviceRoutes from './routes/device';
import faceRecognitionRoutes from './routes/face-recognition';
import reportRoutes from './routes/report';

// Middleware and Security
import { authenticateToken, requireAdmin, requireDosen, requireMahasiswa } from './middleware/auth';

// Error handling and utilities
import { successResponse, errorResponse, serverErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from './utils/response';
import { hashPassword, comparePassword, generateRandomPassword } from './utils/password';
import { generateToken, verifyToken } from './utils/jwt';

// Health check
import healthCheck from './healthcheck';

// Load environment variables
dotenv.config();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsPath = path.join(__dirname, '../uploads');
    cb(null, uploadsPath + '/' + file.originalname);
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

// Security middleware
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    styleSrc: ["'unsafe-inline'"],
      scriptSrc: ["'none'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      fontSrc: ["'self'", 'data:', 'blob:'],
    },
  },
});

// Request logging
const requestLogging = morgan('combined');

const app = express();

// Apply security middleware
app.use(securityMiddleware);

// Apply CORS
app.use(cors(corsOptions));

// Rate limiting
app.use(limiter);

// Request logging
app.use(requestLogging);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/mata-kuliah', mataKuliahRoutes);
app.use('/api/kelas', kelasRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/face-recognition', faceRecognitionRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', healthCheck);

// 404 handler
app.use('*', (req, res) => {
  return notFoundResponse(res, 'API endpoint not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  return serverErrorResponse(res, 'Internal server error', err);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('API Base URL: http://localhost:${PORT}/api');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
if (require.main === module) {
  startServer();
}

export default app;