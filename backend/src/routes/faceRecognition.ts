import { Router } from 'express';
import * as faceRecognitionController from '../controllers/faceRecognitionController';
import { authenticateToken, requireAdmin, requireDosen } from '../middleware/auth';

const router = Router();

// Session management
router.post('/session/start',
  authenticateToken,
  requireDosen,
  faceRecognitionController.startSesiValidation,
  faceRecognitionController.startSesiAbsensi
);

router.post('/session/:sesiId/stop',
  authenticateToken,
  requireDosen,
  faceRecognitionController.stopSesiAbsensi
);

router.get('/sessions/active',
  authenticateToken,
  faceRecognitionController.getActiveSessions
);

router.get('/session/:sesiId/attendance',
  authenticateToken,
  faceRecognitionController.getSessionAttendance
);

// Face scanning (device endpoint - no auth required, validated by device ID)
router.post('/scan',
  faceRecognitionController.scanFace
);

// Manual attendance marking
router.post('/session/:sesiId/manual',
  authenticateToken,
  requireDosen,
  faceRecognitionController.markManualAttendance
);

export default router;