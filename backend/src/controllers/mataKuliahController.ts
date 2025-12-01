import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { MataKuliah } from '../models';
import { successResponse, errorResponse } from '../utils/response';

// Validation rules
export const mataKuliahValidation = [
  body('kode').notEmpty().withMessage('Kode mata kuliah is required'),
  body('nama').notEmpty().withMessage('Nama mata kuliah is required'),
  body('sks').isInt({ min: 1, max: 6 }).withMessage('SKS must be between 1 and 6'),
  body('semester').isInt({ min: 1, max: 14 }).withMessage('Semester must be between 1 and 14'),
  body('jurusan').notEmpty().withMessage('Jurusan is required'),
];

// Get all mata kuliah with pagination
export const getAllMataKuliah = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    const jurusan = req.query.jurusan as string;

    const whereClause: any = {};

    if (search) {
      whereClause[MataKuliah.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or'] = [
        { nama: { [MataKuliah.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { kode: { [MataKuliah.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { jurusan: { [MataKuliah.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } }
      ];
    }

    if (jurusan) {
      whereClause.jurusan = jurusan;
    }

    const { count, rows: mataKuliahs } = await MataKuliah.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Mata kuliah retrieved successfully', mataKuliahs, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all mata kuliah error:', error);
    errorResponse(res, 'Failed to retrieve mata kuliah', error, 500);
  }
};

// Get mata kuliah by ID
export const getMataKuliahById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mataKuliah = await MataKuliah.findByPk(id);

    if (!mataKuliah) {
      errorResponse(res, 'Mata kuliah not found', null, 404);
      return;
    }

    successResponse(res, 'Mata kuliah retrieved successfully', mataKuliah);
  } catch (error) {
    console.error('Get mata kuliah by ID error:', error);
    errorResponse(res, 'Failed to retrieve mata kuliah', error, 500);
  }
};

// Create new mata kuliah
export const createMataKuliah = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { kode, nama, sks, semester, jurusan, deskripsi } = req.body;

    // Check if kode already exists
    const existingMataKuliah = await MataKuliah.findOne({
      where: { kode }
    });

    if (existingMataKuliah) {
      errorResponse(res, 'Kode mata kuliah already exists');
      return;
    }

    const mataKuliah = await MataKuliah.create({
      kode,
      nama,
      sks,
      semester,
      jurusan,
      deskripsi,
    });

    successResponse(res, 'Mata kuliah created successfully', mataKuliah, 201);
  } catch (error) {
    console.error('Create mata kuliah error:', error);
    errorResponse(res, 'Failed to create mata kuliah', error, 500);
  }
};

// Update mata kuliah
export const updateMataKuliah = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { id } = req.params;
    const { kode, nama, sks, semester, jurusan, deskripsi } = req.body;

    const mataKuliah = await MataKuliah.findByPk(id);
    if (!mataKuliah) {
      errorResponse(res, 'Mata kuliah not found', null, 404);
      return;
    }

    // Check if kode already exists (excluding current mata kuliah)
    const existingMataKuliah = await MataKuliah.findOne({
      where: {
        kode,
        id: { [MataKuliah.sequelize!.getDialect() === 'mysql' ? '!=' : '$ne']: id }
      }
    });

    if (existingMataKuliah) {
      errorResponse(res, 'Kode mata kuliah already exists');
      return;
    }

    await mataKuliah.update({
      kode,
      nama,
      sks,
      semester,
      jurusan,
      deskripsi,
    });

    successResponse(res, 'Mata kuliah updated successfully', mataKuliah);
  } catch (error) {
    console.error('Update mata kuliah error:', error);
    errorResponse(res, 'Failed to update mata kuliah', error, 500);
  }
};

// Delete mata kuliah
export const deleteMataKuliah = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mataKuliah = await MataKuliah.findByPk(id);
    if (!mataKuliah) {
      errorResponse(res, 'Mata kuliah not found', null, 404);
      return;
    }

    await mataKuliah.destroy();

    successResponse(res, 'Mata kuliah deleted successfully');
  } catch (error) {
    console.error('Delete mata kuliah error:', error);
    errorResponse(res, 'Failed to delete mata kuliah', error, 500);
  }
};