import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authenticateToken, requireAdmin, requireDosen } from '../middleware/auth';

const router = Router();

// Dashboard statistics
router.get('/dashboard',
  authenticateToken,
  reportController.getDashboardStats
);

// Class attendance reports
router.get('/class/:kelasId',
  authenticateToken,
  requireDosen,
  reportController.getClassAttendanceReport
);

// Mahasiswa attendance reports
router.get('/mahasiswa/:mahasiswaId',
  authenticateToken,
  requireAdmin,
  reportController.getMahasiswaAttendanceReport
);

// Export reports (Excel/PDF)
router.get('/export/:type/:id',
  authenticateToken,
  requireAdmin,
  reportController.exportReport
);

export default router;