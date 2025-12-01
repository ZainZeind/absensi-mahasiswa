import { Router } from 'express';
import * as dosenController from '../controllers/dosenController';
import { authenticateToken, requireAdmin, requireDosen } from '../middleware/auth';

const router = Router();

// Public routes (with authentication)
router.get('/',
  authenticateToken,
  requireAdmin,
  dosenController.getAllDosen
);

router.get('/:id',
  authenticateToken,
  requireAdmin,
  dosenController.getDosenById
);

// Admin only routes
router.post('/',
  authenticateToken,
  requireAdmin,
  dosenController.dosenValidation,
  dosenController.createDosen
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  dosenController.dosenValidation,
  dosenController.updateDosen
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  dosenController.deleteDosen
);

// Dosen profile management (for dosen themselves)
router.put('/profile/me',
  authenticateToken,
  requireDosen,
  dosenController.updateProfile
);

export default router;