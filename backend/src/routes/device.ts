import { Router } from 'express';
import * as deviceController from '../controllers/deviceController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (with authentication)
router.get('/',
  authenticateToken,
  deviceController.getAllDevices
);

router.get('/stats',
  authenticateToken,
  deviceController.getDeviceStats
);

router.get('/:id',
  authenticateToken,
  deviceController.getDeviceById
);

// Device communication routes (no auth required - device API key validation in controller)
router.post('/:deviceId/heartbeat',
  deviceController.deviceHeartbeat
);

// Admin only routes
router.post('/',
  authenticateToken,
  requireAdmin,
  deviceController.deviceValidation,
  deviceController.createDevice
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  deviceController.deviceValidation,
  deviceController.updateDevice
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  deviceController.deleteDevice
);

export default router;