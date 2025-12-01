import { Router } from 'express';
import * as kelasController from '../controllers/kelasController';
import { authenticateToken, requireAdmin, requireDosen, requireMahasiswa } from '../middleware/auth';

const router = Router();

// Public routes (with authentication)
router.get('/',
  authenticateToken,
  requireAdmin,
  kelasController.getAllKelas
);

router.get('/:id',
  authenticateToken,
  kelasController.getKelasById
);

// Dosen specific routes
router.get('/dosen/my-classes',
  authenticateToken,
  requireDosen,
  kelasController.getKelasForDosen
);

// Mahasiswa specific routes
router.get('/mahasiswa/my-classes',
  authenticateToken,
  requireMahasiswa,
  kelasController.getKelasForMahasiswa
);

// Admin only routes
router.post('/',
  authenticateToken,
  requireAdmin,
  kelasController.kelasValidation,
  kelasController.createKelas
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  kelasController.kelasValidation,
  kelasController.updateKelas
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  kelasController.deleteKelas
);

export default router;