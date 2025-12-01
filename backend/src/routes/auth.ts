import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Login route
router.post('/login',
  authController.loginValidation,
  authController.login
);

// Register route (Admin only)
router.post('/register',
  authenticateToken,
  requireAdmin,
  authController.registerValidation,
  authController.register
);

// Get current user
router.get('/me',
  authenticateToken,
  authController.getCurrentUser
);

// Update password
router.put('/password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  authController.updatePassword
);

// Logout
router.post('/logout',
  authenticateToken,
  authController.logout
);

export default router;