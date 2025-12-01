import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Kelas, MataKuliah, Dosen, Enrollment, Mahasiswa } from '../models';
import { successResponse, errorResponse } from '../utils/response';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Validation rules
export const kelasValidation = [
  body('nama').notEmpty().withMessage('Nama kelas is required'),
  body('matkulId').isInt().withMessage('Mata kuliah ID is required'),
  body('dosenId').isInt().withMessage('Dosen ID is required'),
  body('hari').isIn(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).withMessage('Invalid hari'),
  body('jamMulai').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid jam mulai format (HH:MM)'),
  body('jamSelesai').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid jam selesai format (HH:MM)'),
  body('ruang').notEmpty().withMessage('Ruang is required'),
  body('kapasitas').isInt({ min: 1 }).withMessage('Kapasitas must be at least 1'),
  body('tahunAjaran').notEmpty().withMessage('Tahun ajaran is required'),
  body('semester').isIn(['Ganjil', 'Genap']).withMessage('Invalid semester'),
];

// Get all kelas with pagination
export const getAllKelas = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';

    const whereClause: any = {};

    if (search) {
      whereClause[Kelas.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or'] = [
        { nama: { [Kelas.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { ruang: { [Kelas.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { tahunAjaran: { [Kelas.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } }
      ];
    }

    const { count, rows: kelass } = await Kelas.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MataKuliah,
          as: 'matkul',
          attributes: ['id', 'kode', 'nama', 'sks'],
        },
        {
          model: Dosen,
          as: 'dosen',
          attributes: ['id', 'nidn', 'nama'],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Kelas retrieved successfully', kelass, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all kelas error:', error);
    errorResponse(res, 'Failed to retrieve kelas', error, 500);
  }
};

// Get kelas by ID
export const getKelasById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const kelas = await Kelas.findByPk(id, {
      include: [
        {
          model: MataKuliah,
          as: 'matkul',
        },
        {
          model: Dosen,
          as: 'dosen',
        },
        {
          model: Mahasiswa,
          as: 'mahasiswas',
          through: { attributes: ['isActive', 'tanggalEnroll'] },
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan', 'semester'],
        },
      ],
    });

    if (!kelas) {
      errorResponse(res, 'Kelas not found', null, 404);
      return;
    }

    successResponse(res, 'Kelas retrieved successfully', kelas);
  } catch (error) {
    console.error('Get kelas by ID error:', error);
    errorResponse(res, 'Failed to retrieve kelas', error, 500);
  }
};

// Get kelas for dosen (for dosen dashboard)
export const getKelasForDosen = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dosenId = req.user!.profileId;

    const kelass = await Kelas.findAll({
      where: { dosenId },
      include: [
        {
          model: MataKuliah,
          as: 'matkul',
          attributes: ['id', 'kode', 'nama', 'sks'],
        },
      ],
      order: [['hari', 'ASC'], ['jamMulai', 'ASC']],
    });

    successResponse(res, 'Kelas retrieved successfully', kelass);
  } catch (error) {
    console.error('Get kelas for dosen error:', error);
    errorResponse(res, 'Failed to retrieve kelas', error, 500);
  }
};

// Get kelas for mahasiswa (for mahasiswa dashboard)
export const getKelasForMahasiswa = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mahasiswaId = req.user!.profileId;

    const enrollments = await Enrollment.findAll({
      where: {
        mahasiswaId,
        isActive: true
      },
      include: [
        {
          model: Kelas,
          as: 'kelas',
          include: [
            {
              model: MataKuliah,
              as: 'matkul',
              attributes: ['id', 'kode', 'nama', 'sks'],
            },
            {
              model: Dosen,
              as: 'dosen',
              attributes: ['id', 'nidn', 'nama'],
            },
          ],
        },
      ],
      order: [[{ model: Kelas, as: 'kelas' }, 'hari', 'ASC'], [{ model: Kelas, as: 'kelas' }, 'jamMulai', 'ASC']],
    });

    const kelass = enrollments.map(enrollment => enrollment.kelas);

    successResponse(res, 'Kelas retrieved successfully', kelass);
  } catch (error) {
    console.error('Get kelas for mahasiswa error:', error);
    errorResponse(res, 'Failed to retrieve kelas', error, 500);
  }
};

// Create new kelas
export const createKelas = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { nama, matkulId, dosenId, hari, jamMulai, jamSelesai, ruang, kapasitas, tahunAjaran, semester } = req.body;

    // Validate matkul and dosen exist
    const matkul = await MataKuliah.findByPk(matkulId);
    const dosen = await Dosen.findByPk(dosenId);

    if (!matkul) {
      errorResponse(res, 'Mata kuliah not found', null, 404);
      return;
    }

    if (!dosen) {
      errorResponse(res, 'Dosen not found', null, 404);
      return;
    }

    const kelas = await Kelas.create({
      nama,
      matkulId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruang,
      kapasitas,
      tahunAjaran,
      semester,
    });

    const kelasWithRelations = await Kelas.findByPk(kelas.id, {
      include: [
        {
          model: MataKuliah,
          as: 'matkul',
          attributes: ['id', 'kode', 'nama', 'sks'],
        },
        {
          model: Dosen,
          as: 'dosen',
          attributes: ['id', 'nidn', 'nama'],
        },
      ],
    });

    successResponse(res, 'Kelas created successfully', kelasWithRelations, 201);
  } catch (error) {
    console.error('Create kelas error:', error);
    errorResponse(res, 'Failed to create kelas', error, 500);
  }
};

// Update kelas
export const updateKelas = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { id } = req.params;
    const { nama, matkulId, dosenId, hari, jamMulai, jamSelesai, ruang, kapasitas, tahunAjaran, semester } = req.body;

    const kelas = await Kelas.findByPk(id);
    if (!kelas) {
      errorResponse(res, 'Kelas not found', null, 404);
      return;
    }

    // Validate matkul and dosen exist
    const matkul = await MataKuliah.findByPk(matkulId);
    const dosen = await Dosen.findByPk(dosenId);

    if (!matkul) {
      errorResponse(res, 'Mata kuliah not found', null, 404);
      return;
    }

    if (!dosen) {
      errorResponse(res, 'Dosen not found', null, 404);
      return;
    }

    await kelas.update({
      nama,
      matkulId,
      dosenId,
      hari,
      jamMulai,
      jamSelesai,
      ruang,
      kapasitas,
      tahunAjaran,
      semester,
    });

    const kelasWithRelations = await Kelas.findByPk(kelas.id, {
      include: [
        {
          model: MataKuliah,
          as: 'matkul',
          attributes: ['id', 'kode', 'nama', 'sks'],
        },
        {
          model: Dosen,
          as: 'dosen',
          attributes: ['id', 'nidn', 'nama'],
        },
      ],
    });

    successResponse(res, 'Kelas updated successfully', kelasWithRelations);
  } catch (error) {
    console.error('Update kelas error:', error);
    errorResponse(res, 'Failed to update kelas', error, 500);
  }
};

// Delete kelas
export const deleteKelas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const kelas = await Kelas.findByPk(id);
    if (!kelas) {
      errorResponse(res, 'Kelas not found', null, 404);
      return;
    }

    await kelas.destroy();

    successResponse(res, 'Kelas deleted successfully');
  } catch (error) {
    console.error('Delete kelas error:', error);
    errorResponse(res, 'Failed to delete kelas', error, 500);
  }
};