import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Mahasiswa, User } from '../models';
import { hashPassword } from '../utils/password';
import { successResponse, errorResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation rules
export const mahasiswaValidation = [
  body('nim').notEmpty().withMessage('NIM is required'),
  body('nama').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('jurusan').notEmpty().withMessage('Jurusan is required'),
  body('semester').isInt({ min: 1, max: 14 }).withMessage('Semester must be between 1 and 14'),
];

// Get all mahasiswa with pagination
export const getAllMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    const whereClause: any = {};

    if (search) {
      whereClause[Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or'] = [
        { nama: { [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { nim: { [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { email: { [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { jurusan: { [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } }
      ];
    }

    const { count, rows: mahasiswas } = await Mahasiswa.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Mahasiswa retrieved successfully', mahasiswas, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all mahasiswa error:', error);
    errorResponse(res, 'Failed to retrieve mahasiswa', error, 500);
  }
};

// Get mahasiswa by ID
export const getMahasiswaById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mahasiswa = await Mahasiswa.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'isActive', 'lastLogin'],
        }
      ]
    });

    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa not found', null, 404);
      return;
    }

    successResponse(res, 'Mahasiswa retrieved successfully', mahasiswa);
  } catch (error) {
    console.error('Get mahasiswa by ID error:', error);
    errorResponse(res, 'Failed to retrieve mahasiswa', error, 500);
  }
};

// Create new mahasiswa
export const createMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { nim, nama, email, jurusan, semester, nomorHp, alamat, createAccount = true } = req.body;

    // Check if NIM or email already exists
    const existingMahasiswa = await Mahasiswa.findOne({
      where: {
        [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
          { nim },
          { email }
        ]
      }
    });

    if (existingMahasiswa) {
      errorResponse(res, 'NIM or email already exists');
      return;
    }

    // Create mahasiswa
    const mahasiswa = await Mahasiswa.create({
      nim,
      nama,
      email,
      jurusan,
      semester,
      nomorHp,
      alamat,
    });

    // Create user account if requested
    if (createAccount) {
      const username = nim; // Use NIM as default username
      const defaultPassword = nim; // Use NIM as default password

      const hashedPassword = await hashPassword(defaultPassword);

      await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'mahasiswa',
        profileId: mahasiswa.id,
        profileType: 'mahasiswa',
      });
    }

    successResponse(res, 'Mahasiswa created successfully', mahasiswa, 201);
  } catch (error) {
    console.error('Create mahasiswa error:', error);
    errorResponse(res, 'Failed to create mahasiswa', error, 500);
  }
};

// Update mahasiswa
export const updateMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { id } = req.params;
    const { nim, nama, email, jurusan, semester, nomorHp, alamat } = req.body;

    const mahasiswa = await Mahasiswa.findByPk(id);
    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa not found', null, 404);
      return;
    }

    // Check if NIM or email already exists (excluding current mahasiswa)
    const existingMahasiswa = await Mahasiswa.findOne({
      where: {
        [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'AND' : '$and']: [
          {
            [Mahasiswa.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or']: [
              { nim },
              { email }
            ]
          },
          { id: { [Mahasiswa.sequelize!.getDialect() === 'mysql' ? '!=' : '$ne']: id } }
        ]
      }
    });

    if (existingMahasiswa) {
      errorResponse(res, 'NIM or email already exists');
      return;
    }

    await mahasiswa.update({
      nim,
      nama,
      email,
      jurusan,
      semester,
      nomorHp,
      alamat,
    });

    successResponse(res, 'Mahasiswa updated successfully', mahasiswa);
  } catch (error) {
    console.error('Update mahasiswa error:', error);
    errorResponse(res, 'Failed to update mahasiswa', error, 500);
  }
};

// Delete mahasiswa
export const deleteMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mahasiswa = await Mahasiswa.findByPk(id);
    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa not found', null, 404);
      return;
    }

    // Also delete associated user account
    await User.destroy({
      where: {
        profileId: id,
        profileType: 'mahasiswa'
      }
    });

    await mahasiswa.destroy();

    successResponse(res, 'Mahasiswa deleted successfully');
  } catch (error) {
    console.error('Delete mahasiswa error:', error);
    errorResponse(res, 'Failed to delete mahasiswa', error, 500);
  }
};

// Update mahasiswa profile (for mahasiswa themselves)
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mahasiswaId = req.user!.profileId;
    const { nama, nomorHp, alamat } = req.body;

    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa profile not found', null, 404);
      return;
    }

    await mahasiswa.update({
      nama,
      nomorHp,
      alamat,
    });

    successResponse(res, 'Profile updated successfully', mahasiswa);
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 'Failed to update profile', error, 500);
  }
};

// Update mahasiswa face photo
export const updateFacePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mahasiswaId = req.user!.profileId;

    if (!req.file) {
      errorResponse(res, 'Face photo is required');
      return;
    }

    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa not found', null, 404);
      return;
    }

    // In a real implementation, you would save the file to storage
    // and get the URL. For now, we'll simulate with the file path
    const facePhotoUrl = `/uploads/faces/${req.file.filename}`;

    await mahasiswa.update({
      fotoWajah: facePhotoUrl,
    });

    successResponse(res, 'Face photo updated successfully', { fotoWajah: facePhotoUrl });
  } catch (error) {
    console.error('Update face photo error:', error);
    errorResponse(res, 'Failed to update face photo', error, 500);
  }
};