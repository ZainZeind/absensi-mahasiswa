import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './models';

// Import routes
import authRoutes from './routes/auth';
import mahasiswaRoutes from './routes/mahasiswa';
import dosenRoutes from './routes/dosen';
import mataKuliahRoutes from './routes/mataKuliah';
import kelasRoutes from './routes/kelas';
import enrollmentRoutes from './routes/enrollment';
import deviceRoutes from './routes/device';
import faceRecognitionRoutes from './routes/faceRecognition';
import reportRoutes from './routes/report';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Add your frontend domain
    : ['http://localhost:3000', 'http://localhost:5173'], // Development domains
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');

    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Create subdirectories based on file type
    let subDir = 'others';
    if (file.fieldname === 'fotoWajah' || file.fieldname === 'face_photo') {
      subDir = 'faces';
    } else if (file.fieldname === 'fotoProfil' || file.fieldname === 'profile_photo') {
      subDir = 'profiles';
    }

    const finalPath = path.join(uploadPath, subDir);
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5000000'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
});

// Make upload middleware available globally
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Database validation error',
      error: err.errors?.map((e: any) => e.message) || err.message,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      error: err.errors?.map((e: any) => e.message) || err.message,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync database models (in development, use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized successfully.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);

      if (process.env.NODE_ENV !== 'production') {
        console.log('\nAvailable endpoints:');
        console.log('  Health Check: GET /health');
        console.log('  Authentication: POST /api/auth/login');
        console.log('  Mahasiswa: GET /api/mahasiswa');
        console.log('  Dosen: GET /api/dosen');
        console.log('  Mata Kuliah: GET /api/mata-kuliah');
        console.log('  Kelas: GET /api/kelas');
        console.log('  Devices: GET /api/devices');
        console.log('  Face Recognition: POST /api/face-recognition/scan');
        console.log('  Reports: GET /api/reports/dashboard');
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
startServer();

export default app;