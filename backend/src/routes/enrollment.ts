import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollmentController';
import { authenticateToken, requireAdmin, requireDosen } from '../middleware/auth';

const router = Router();

// Get all enrollments (admin only)
router.get('/',
  authenticateToken,
  requireAdmin,
  enrollmentController.getAllEnrollments
);

// Get enrollment statistics
router.get('/stats',
  authenticateToken,
  requireAdmin,
  enrollmentController.getEnrollmentStats
);

// Get enrollment by ID (admin only)
router.get('/:id',
  authenticateToken,
  requireAdmin,
  enrollmentController.getEnrollmentById
);

// Get enrollments by class (dosen/admin)
router.get('/class/:kelasId',
  authenticateToken,
  requireDosen,
  enrollmentController.getEnrollmentsByClass
);

// Get enrollments by mahasiswa (admin/mahasiswa themselves)
router.get('/mahasiswa/:mahasiswaId',
  authenticateToken,
  enrollmentController.getEnrollmentsByMahasiswa
);

// Enroll mahasiswa to class (admin/dosen)
router.post('/enroll',
  authenticateToken,
  requireAdmin, // Can be modified to allow dosen for their own classes
  enrollmentController.enrollmentValidation,
  enrollmentController.enrollMahasiswa
);

// Update enrollment (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  enrollmentController.updateEnrollment
);

// Unenroll mahasiswa (admin/dosen)
router.put('/:id/unenroll',
  authenticateToken,
  requireAdmin, // Can be modified to allow dosen for their own classes
  enrollmentController.unenrollMahasiswa
);

export default router;