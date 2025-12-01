import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, Mahasiswa, Dosen } from '../models';
import { generateToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';
import { successResponse, errorResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation rules
export const loginValidation = [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'dosen', 'mahasiswa']).withMessage('Invalid role'),
];

// Login Controller
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [User.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
          { username },
          { email: username }
        ]
      },
      include: [
        {
          model: Mahasiswa,
          as: 'mahasiswaProfile',
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan', 'semester', 'fotoProfil']
        },
        {
          model: Dosen,
          as: 'dosenProfile',
          attributes: ['id', 'nidn', 'nama', 'email', 'jurusan', 'fotoProfil']
        }
      ]
    });

    if (!user || !user.isActive) {
      errorResponse(res, 'Invalid credentials or inactive account', null, 401);
      return;
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      errorResponse(res, 'Invalid credentials', null, 401);
      return;
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user);

    // Prepare user profile data
    const userData: any = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    };

    if (user.role === 'mahasiswa' && user.mahasiswaProfile) {
      userData.profile = user.mahasiswaProfile;
    } else if (user.role === 'dosen' && user.dosenProfile) {
      userData.profile = user.dosenProfile;
    }

    successResponse(res, 'Login successful', {
      user: userData,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'Login failed', error, 500);
  }
};

// Register Controller (Admin only)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { username, email, password, role, profileData } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      errorResponse(res, 'Username or email already exists');
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    let profileId = null;
    let profileType = null;

    // Create profile based on role
    if (role === 'mahasiswa' && profileData) {
      const mahasiswa = await Mahasiswa.create({
        nim: profileData.nim,
        nama: profileData.nama,
        email: profileData.email,
        jurusan: profileData.jurusan,
        semester: profileData.semester,
        nomorHp: profileData.nomorHp,
        alamat: profileData.alamat,
      });
      profileId = mahasiswa.id;
      profileType = 'mahasiswa';
    } else if (role === 'dosen' && profileData) {
      const dosen = await Dosen.create({
        nidn: profileData.nidn,
        nama: profileData.nama,
        email: profileData.email,
        jurusan: profileData.jurusan,
        nomorHp: profileData.nomorHp,
        alamat: profileData.alamat,
      });
      profileId = dosen.id;
      profileType = 'dosen';
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      profileId,
      profileType,
    });

    // Generate JWT token
    const token = generateToken(user);

    successResponse(res, 'User registered successfully', {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileId: user.profileId,
        profileType: user.profileType,
      },
      token,
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    errorResponse(res, 'Registration failed', error, 500);
  }
};

// Get Current User
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Mahasiswa,
          as: 'mahasiswaProfile',
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan', 'semester', 'fotoProfil']
        },
        {
          model: Dosen,
          as: 'dosenProfile',
          attributes: ['id', 'nidn', 'nama', 'email', 'jurusan', 'fotoProfil']
        }
      ]
    });

    if (!user) {
      errorResponse(res, 'User not found', null, 404);
      return;
    }

    successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, 'Failed to retrieve user', error, 500);
  }
};

// Update Password
export const updatePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      errorResponse(res, 'Current password and new password are required');
      return;
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      errorResponse(res, 'User not found', null, 404);
      return;
    }

    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      errorResponse(res, 'Current password is incorrect');
      return;
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await user.update({ password: hashedNewPassword });

    successResponse(res, 'Password updated successfully');
  } catch (error) {
    console.error('Update password error:', error);
    errorResponse(res, 'Failed to update password', error, 500);
  }
};

// Logout (optional - client-side token removal)
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token from storage
    successResponse(res, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 'Logout failed', error, 500);
  }
};