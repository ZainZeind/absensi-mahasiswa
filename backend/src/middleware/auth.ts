import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      unauthorizedResponse(res, 'Access token required');
      return;
    }

    const decoded = verifyToken(token);

    // Get fresh user data from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      unauthorizedResponse(res, 'Invalid or inactive user');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    unauthorizedResponse(res, 'Invalid token');
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      forbiddenResponse(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireDosen = requireRole(['dosen', 'admin']);
export const requireMahasiswa = requireRole(['mahasiswa', 'admin']);