import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Enrollment, Kelas, Mahasiswa } from '../models';
import { successResponse, errorResponse } from '../utils/response';
import { Op } from 'sequelize';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation rules
export const enrollmentValidation = [
  body('kelasId').isInt().withMessage('Kelas ID is required'),
  body('mahasiswaIds').isArray().withMessage('Mahasiswa IDs array is required'),
];

// Get all enrollments (with filters)
export const getAllEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const { kelasId, mahasiswaId, isActive } = req.query;

    const whereClause: any = {};

    if (kelasId) whereClause.kelasId = kelasId;
    if (mahasiswaId) whereClause.mahasiswaId = mahasiswaId;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Kelas,
          as: 'kelas',
          include: [
            {
              model: Mahasiswa.sequelize!.models.MataKuliah,
              as: 'matkul',
              attributes: ['id', 'kode', 'nama'],
            },
            {
              model: Mahasiswa.sequelize!.models.Dosen,
              as: 'dosen',
              attributes: ['id', 'nama', 'nidn'],
            },
          ],
        },
        {
          model: Mahasiswa,
          as: 'mahasiswa',
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan', 'semester'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Enrollments retrieved successfully', enrollments, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all enrollments error:', error);
    errorResponse(res, 'Failed to retrieve enrollments', error, 500);
  }
};

// Get enrollment by ID
export const getEnrollmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id, {
      include: [
        {
          model: Kelas,
          as: 'kelas',
          include: [
            {
              model: Mahasiswa.sequelize!.models.MataKuliah,
              as: 'matkul',
            },
            {
              model: Mahasiswa.sequelize!.models.Dosen,
              as: 'dosen',
            },
          ],
        },
        {
          model: Mahasiswa,
          as: 'mahasiswa',
        },
      ],
    });

    if (!enrollment) {
      errorResponse(res, 'Enrollment not found', null, 404);
      return;
    }

    successResponse(res, 'Enrollment retrieved successfully', enrollment);
  } catch (error) {
    console.error('Get enrollment by ID error:', error);
    errorResponse(res, 'Failed to retrieve enrollment', error, 500);
  }
};

// Enroll mahasiswa to class
export const enrollMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { kelasId, mahasiswaIds } = req.body;

    // Validate kelas exists
    const kelas = await Kelas.findByPk(kelasId);
    if (!kelas) {
      errorResponse(res, 'Kelas not found', null, 404);
      return;
    }

    // Validate all mahasiswa exist
    const mahasiswas = await Mahasiswa.findAll({
      where: {
        id: { [Op.in]: mahasiswaIds },
      },
    });

    if (mahasiswas.length !== mahasiswaIds.length) {
      errorResponse(res, 'One or more mahasiswa not found');
      return;
    }

    // Check capacity
    const currentEnrollments = await Enrollment.count({
      where: {
        kelasId,
        isActive: true,
      },
    });

    const newEnrollments = mahasiswaIds.length;
    if (currentEnrollments + newEnrollments > kelas.kapasitas) {
      errorResponse(res, `Class capacity exceeded. Current: ${currentEnrollments}, Available: ${kelas.kapasitas - currentEnrollments}`);
      return;
    }

    // Create enrollments
    const enrollmentResults = [];
    const errors = [];

    for (const mahasiswaId of mahasiswaIds) {
      try {
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          where: {
            kelasId,
            mahasiswaId,
          },
        });

        if (existingEnrollment) {
          if (existingEnrollment.isActive) {
            errors.push(`Mahasiswa ${mahasiswaId} is already enrolled in this class`);
            continue;
          } else {
            // Reactivate existing enrollment
            await existingEnrollment.update({ isActive: true });
            enrollmentResults.push(existingEnrollment);
            continue;
          }
        }

        // Create new enrollment
        const enrollment = await Enrollment.create({
          kelasId,
          mahasiswaId,
          isActive: true,
        });

        enrollmentResults.push(enrollment);
      } catch (error) {
        errors.push(`Failed to enroll mahasiswa ${mahasiswaId}: ${error}`);
      }
    }

    successResponse(res, 'Enrollments processed successfully', {
      successCount: enrollmentResults.length,
      errorCount: errors.length,
      enrollments: enrollmentResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Enroll mahasiswa error:', error);
    errorResponse(res, 'Failed to enroll mahasiswa', error, 500);
  }
};

// Unenroll mahasiswa from class
export const unenrollMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      errorResponse(res, 'Enrollment not found', null, 404);
      return;
    }

    // Soft delete (deactivate) instead of hard delete
    await enrollment.update({ isActive: false });

    successResponse(res, 'Mahasiswa unenrolled successfully', enrollment);
  } catch (error) {
    console.error('Unenroll mahasiswa error:', error);
    errorResponse(res, 'Failed to unenroll mahasiswa', error, 500);
  }
};

// Update enrollment
export const updateEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      errorResponse(res, 'Enrollment not found', null, 404);
      return;
    }

    await enrollment.update({
      isActive: isActive !== undefined ? isActive : enrollment.isActive,
    });

    successResponse(res, 'Enrollment updated successfully', enrollment);
  } catch (error) {
    console.error('Update enrollment error:', error);
    errorResponse(res, 'Failed to update enrollment', error, 500);
  }
};

// Get enrollments by class
export const getEnrollmentsByClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kelasId } = req.params;
    const { isActive } = req.query;

    const whereClause: any = { kelasId };
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const enrollments = await Enrollment.findAll({
      where: whereClause,
      include: [
        {
          model: Mahasiswa,
          as: 'mahasiswa',
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan', 'semester'],
        },
      ],
      order: [['tanggalEnroll', 'ASC']],
    });

    successResponse(res, 'Class enrollments retrieved successfully', enrollments);
  } catch (error) {
    console.error('Get enrollments by class error:', error);
    errorResponse(res, 'Failed to retrieve class enrollments', error, 500);
  }
};

// Get enrollments by mahasiswa
export const getEnrollmentsByMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mahasiswaId } = req.params;
    const { isActive } = req.query;

    const whereClause: any = { mahasiswaId };
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const enrollments = await Enrollment.findAll({
      where: whereClause,
      include: [
        {
          model: Kelas,
          as: 'kelas',
          include: [
            {
              model: Mahasiswa.sequelize!.models.MataKuliah,
              as: 'matkul',
              attributes: ['id', 'kode', 'nama', 'sks'],
            },
            {
              model: Mahasiswa.sequelize!.models.Dosen,
              as: 'dosen',
              attributes: ['id', 'nama', 'nidn'],
            },
          ],
        },
      ],
      order: [['tanggalEnroll', 'ASC']],
    });

    successResponse(res, 'Mahasiswa enrollments retrieved successfully', enrollments);
  } catch (error) {
    console.error('Get enrollments by mahasiswa error:', error);
    errorResponse(res, 'Failed to retrieve mahasiswa enrollments', error, 500);
  }
};

// Get enrollment statistics
export const getEnrollmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kelasId, mahasiswaId } = req.query;

    let baseStats = {
      totalEnrollments: 0,
      activeEnrollments: 0,
      inactiveEnrollments: 0,
    };

    let whereClause: any = {};

    if (kelasId) whereClause.kelasId = kelasId;
    if (mahasiswaId) whereClause.mahasiswaId = mahasiswaId;

    // Total enrollments
    baseStats.totalEnrollments = await Enrollment.count({ where: whereClause });

    // Active enrollments
    baseStats.activeEnrollments = await Enrollment.count({
      where: { ...whereClause, isActive: true },
    });

    // Inactive enrollments
    baseStats.inactiveEnrollments = await Enrollment.count({
      where: { ...whereClause, isActive: false },
    });

    let additionalStats: any = {};

    if (kelasId) {
      // Get class capacity info
      const kelas = await Kelas.findByPk(kelasId as string);
      if (kelas) {
        additionalStats.kelasInfo = {
          nama: kelas.nama,
          kapasitas: kelas.kapasitas,
          enrolled: baseStats.activeEnrollments,
          available: kelas.kapasitas - baseStats.activeEnrollments,
          utilizationPercentage: (baseStats.activeEnrollments / kelas.kapasitas) * 100,
        };
      }
    }

    if (mahasiswaId) {
      // Get mahasiswa enrollment info
      const mahasiswa = await Mahasiswa.findByPk(mahasiswaId as string);
      if (mahasiswa) {
        additionalStats.mahasiswaInfo = {
          nama: mahasiswa.nama,
          nim: mahasiswa.nim,
          jurusan: mahasiswa.jurusan,
          semester: mahasiswa.semester,
          activeEnrollments: baseStats.activeEnrollments,
        };
      }
    }

    successResponse(res, 'Enrollment statistics retrieved successfully', {
      ...baseStats,
      ...additionalStats,
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    errorResponse(res, 'Failed to retrieve enrollment statistics', error, 500);
  }
};