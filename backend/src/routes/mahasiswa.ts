import { Router } from 'express';
import multer from 'multer';
import * as mahasiswaController from '../controllers/mahasiswaController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Public routes (with authentication)
router.get('/',
  authenticateToken,
  requireAdmin,
  mahasiswaController.getAllMahasiswa
);

router.get('/:id',
  authenticateToken,
  requireAdmin,
  mahasiswaController.getMahasiswaById
);

// Admin only routes
router.post('/',
  authenticateToken,
  requireAdmin,
  mahasiswaController.mahasiswaValidation,
  mahasiswaController.createMahasiswa
);

router.put('/:id',
  authenticateToken,
  requireAdmin,
  mahasiswaController.mahasiswaValidation,
  mahasiswaController.updateMahasiswa
);

router.delete('/:id',
  authenticateToken,
  requireAdmin,
  mahasiswaController.deleteMahasiswa
);

// Mahasiswa profile management (for mahasiswa themselves)
router.put('/profile/me',
  authenticateToken,
  mahasiswaController.updateProfile
);

router.post('/profile/face-photo',
  authenticateToken,
  upload.single('facePhoto'),
  mahasiswaController.updateFacePhoto
);

export default router;