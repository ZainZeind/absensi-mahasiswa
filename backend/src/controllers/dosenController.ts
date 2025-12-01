import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Dosen, User } from '../models';
import { hashPassword } from '../utils/password';
import { successResponse, errorResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation rules
export const dosenValidation = [
  body('nidn').notEmpty().withMessage('NIDN is required'),
  body('nama').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('jurusan').notEmpty().withMessage('Jurusan is required'),
];

// Get all dosen with pagination
export const getAllDosen = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    const whereClause: any = {};

    if (search) {
      whereClause[Dosen.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or'] = [
        { nama: { [Dosen.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { nidn: { [Dosen.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { email: { [Dosen.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { jurusan: { [Dosen.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } }
      ];
    }

    const { count, rows: dosens } = await Dosen.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Dosen retrieved successfully', dosens, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all dosen error:', error);
    errorResponse(res, 'Failed to retrieve dosen', error, 500);
  }
};

// Get dosen by ID
export const getDosenById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dosen = await Dosen.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'isActive', 'lastLogin'],
        }
      ]
    });

    if (!dosen) {
      errorResponse(res, 'Dosen not found', null, 404);
      return;
    }

    successResponse(res, 'Dosen retrieved successfully', dosen);
  } catch (error) {
    console.error('Get dosen by ID error:', error);
    errorResponse(res, 'Failed to retrieve dosen', error, 500);
  }
};

// Create new dosen
export const createDosen = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { nidn, nama, email, jurusan, nomorHp, alamat, createAccount = true } = req.body;

    // Check if NIDN or email already exists
    const existingDosen = await Dosen.findOne({
      where: {
        [Dosen.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
          { nidn },
          { email }
        ]
      }
    });

    if (existingDosen) {
      errorResponse(res, 'NIDN or email already exists');
      return;
    }

    // Create dosen
    const dosen = await Dosen.create({
      nidn,
      nama,
      email,
      jurusan,
      nomorHp,
      alamat,
    });

    // Create user account if requested
    if (createAccount) {
      const username = nidn; // Use NIDN as default username
      const defaultPassword = nidn; // Use NIDN as default password

      const hashedPassword = await hashPassword(defaultPassword);

      await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'dosen',
        profileId: dosen.id,
        profileType: 'dosen',
      });
    }

    successResponse(res, 'Dosen created successfully', dosen, 201);
  } catch (error) {
    console.error('Create dosen error:', error);
    errorResponse(res, 'Failed to create dosen', error, 500);
  }
};

// Update dosen
export const updateDosen = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { id } = req.params;
    const { nidn, nama, email, jurusan, nomorHp, alamat } = req.body;

    const dosen = await Dosen.findByPk(id);
    if (!dosen) {
      errorResponse(res, 'Dosen not found', null, 404);
      return;
    }

    // Check if NIDN or email already exists (excluding current dosen)
    const existingDosen = await Dosen.findOne({
      where: {
        [Dosen.sequelize!.getDialect() === 'mysql' ? 'AND' : '$and']: [
          {
            [Dosen.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
              { nidn },
              { email }
            ]
          },
          { id: { [Dosen.sequelize!.getDialect() === 'mysql' ? '!=' : '$ne']: id } }
        ]
      }
    });

    if (existingDosen) {
      errorResponse(res, 'NIDN or email already exists');
      return;
    }

    await dosen.update({
      nidn,
      nama,
      email,
      jurusan,
      nomorHp,
      alamat,
    });

    successResponse(res, 'Dosen updated successfully', dosen);
  } catch (error) {
    console.error('Update dosen error:', error);
    errorResponse(res, 'Failed to update dosen', error, 500);
  }
};

// Delete dosen
export const deleteDosen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const dosen = await Dosen.findByPk(id);
    if (!dosen) {
      errorResponse(res, 'Dosen not found', null, 404);
      return;
    }

    // Also delete associated user account
    await User.destroy({
      where: {
        profileId: id,
        profileType: 'dosen'
      }
    });

    await dosen.destroy();

    successResponse(res, 'Dosen deleted successfully');
  } catch (error) {
    console.error('Delete dosen error:', error);
    errorResponse(res, 'Failed to delete dosen', error, 500);
  }
};

// Update dosen profile (for dosen themselves)
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dosenId = req.user!.profileId;
    const { nama, nomorHp, alamat } = req.body;

    const dosen = await Dosen.findByPk(dosenId);
    if (!dosen) {
      errorResponse(res, 'Dosen profile not found', null, 404);
      return;
    }

    await dosen.update({
      nama,
      nomorHp,
      alamat,
    });

    successResponse(res, 'Profile updated successfully', dosen);
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 'Failed to update profile', error, 500);
  }
};