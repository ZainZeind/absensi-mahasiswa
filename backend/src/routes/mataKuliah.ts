import { Router } from 'express';
import * as mataKuliahController from '../controllers/mataKuliahController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (with authentication)
router.get('/',
  authenticateToken,
  requireAdmin,
  mataKuliahController.getAllMataKuliah
);

router.get('/:id',
  authenticateToken,
  requireAdmin,
  mataKuliahController.getMataKuliahById
);

// Admin only routes
router.post('/',
  authenticateToken,
  requireAdmin,
  mataKuliahController.mataKuliahValidation,
  mataKuliahController.createMataKuliah
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  mataKuliahController.mataKuliahValidation,
  mataKuliahController.updateMataKuliah
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  mataKuliahController.deleteMataKuliah
);

export default router;