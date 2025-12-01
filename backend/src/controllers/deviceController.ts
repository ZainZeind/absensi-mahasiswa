import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Device, Kelas } from '../models';
import { successResponse, errorResponse } from '../utils/response';
import { Op } from 'sequelize';

// Validation rules
export const deviceValidation = [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('nama').notEmpty().withMessage('Device name is required'),
  body('lokasi').notEmpty().withMessage('Lokasi is required'),
  body('ruang').notEmpty().withMessage('Ruang is required'),
];

// Get all devices with pagination
export const getAllDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search as string || '';
    const status = req.query.status as string;

    const whereClause: any = {};

    if (search) {
      whereClause[Device.sequelize!.getDialect() === 'mysql' ? 'OR' : '$or'] = [
        { nama: { [Device.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { deviceId: { [Device.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { lokasi: { [Device.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } },
        { ruang: { [Device.sequelize!.getDialect() === 'mysql' ? 'LIKE' : '$like']: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: devices } = await Device.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Kelas,
          as: 'kelas',
          attributes: ['id', 'nama', 'ruang'],
          required: false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Check if devices are online based on lastHeartbeat
    const devicesWithStatus = devices.map(device => {
      const deviceData = device.toJSON();
      if (device.lastHeartbeat) {
        const timeDiff = Date.now() - new Date(device.lastHeartbeat).getTime();
        const timeDiffMinutes = timeDiff / (1000 * 60);

        if (timeDiffMinutes > 5) { // Consider offline if no heartbeat for 5 minutes
          deviceData.status = 'offline';
        } else {
          deviceData.status = 'online';
        }
      }
      return deviceData;
    });

    const totalPages = Math.ceil(count / limit);

    successResponse(res, 'Devices retrieved successfully', devicesWithStatus, 200, {
      page,
      limit,
      total: count,
      totalPages,
    });
  } catch (error) {
    console.error('Get all devices error:', error);
    errorResponse(res, 'Failed to retrieve devices', error, 500);
  }
};

// Get device by ID
export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id, {
      include: [
        {
          model: Kelas,
          as: 'kelas',
          include: [
            {
              model: Device.sequelize!.models.MataKuliah,
              as: 'matkul',
              attributes: ['id', 'kode', 'nama'],
            },
            {
              model: Device.sequelize!.models.Dosen,
              as: 'dosen',
              attributes: ['id', 'nidn', 'nama'],
            },
          ],
        },
      ],
    });

    if (!device) {
      errorResponse(res, 'Device not found', null, 404);
      return;
    }

    successResponse(res, 'Device retrieved successfully', device);
  } catch (error) {
    console.error('Get device by ID error:', error);
    errorResponse(res, 'Failed to retrieve device', error, 500);
  }
};

// Create new device
export const createDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { deviceId, nama, lokasi, ruang, kelasId, isActive = true } = req.body;

    // Check if deviceId already exists
    const existingDevice = await Device.findOne({
      where: { deviceId }
    });

    if (existingDevice) {
      errorResponse(res, 'Device ID already exists');
      return;
    }

    // Validate kelas if provided
    if (kelasId) {
      const kelas = await Kelas.findByPk(kelasId);
      if (!kelas) {
        errorResponse(res, 'Kelas not found', null, 404);
        return;
      }
    }

    const device = await Device.create({
      deviceId,
      nama,
      lokasi,
      ruang,
      kelasId,
      isActive,
      status: 'offline', // New devices start as offline
    });

    const deviceWithRelations = await Device.findByPk(device.id, {
      include: [
        {
          model: Kelas,
          as: 'kelas',
          attributes: ['id', 'nama', 'ruang'],
        },
      ],
    });

    successResponse(res, 'Device created successfully', deviceWithRelations, 201);
  } catch (error) {
    console.error('Create device error:', error);
    errorResponse(res, 'Failed to create device', error, 500);
  }
};

// Update device
export const updateDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { id } = req.params;
    const { deviceId, nama, lokasi, ruang, kelasId, isActive } = req.body;

    const device = await Device.findByPk(id);
    if (!device) {
      errorResponse(res, 'Device not found', null, 404);
      return;
    }

    // Check if deviceId already exists (excluding current device)
    const existingDevice = await Device.findOne({
      where: {
        deviceId,
        id: { [Device.sequelize!.getDialect() === 'mysql' ? '!=' : '$ne']: id }
      }
    });

    if (existingDevice) {
      errorResponse(res, 'Device ID already exists');
      return;
    }

    // Validate kelas if provided
    if (kelasId) {
      const kelas = await Kelas.findByPk(kelasId);
      if (!kelas) {
        errorResponse(res, 'Kelas not found', null, 404);
        return;
      }
    }

    await device.update({
      deviceId,
      nama,
      lokasi,
      ruang,
      kelasId,
      isActive,
    });

    const deviceWithRelations = await Device.findByPk(device.id, {
      include: [
        {
          model: Kelas,
          as: 'kelas',
          attributes: ['id', 'nama', 'ruang'],
        },
      ],
    });

    successResponse(res, 'Device updated successfully', deviceWithRelations);
  } catch (error) {
    console.error('Update device error:', error);
    errorResponse(res, 'Failed to update device', error, 500);
  }
};

// Delete device
export const deleteDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id);
    if (!device) {
      errorResponse(res, 'Device not found', null, 404);
      return;
    }

    await device.destroy();

    successResponse(res, 'Device deleted successfully');
  } catch (error) {
    console.error('Delete device error:', error);
    errorResponse(res, 'Failed to delete device', error, 500);
  }
};

// Device heartbeat (for device communication)
export const deviceHeartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const { ipAddress } = req.body;

    const device = await Device.findOne({
      where: { deviceId }
    });

    if (!device) {
      errorResponse(res, 'Device not found', null, 404);
      return;
    }

    await device.update({
      lastHeartbeat: new Date(),
      ipAddress: ipAddress || req.ip,
      status: 'online',
    });

    successResponse(res, 'Heartbeat updated successfully', {
      lastHeartbeat: device.lastHeartbeat,
      status: 'online',
    });
  } catch (error) {
    console.error('Device heartbeat error:', error);
    errorResponse(res, 'Failed to update heartbeat', error, 500);
  }
};

// Get device statistics
export const getDeviceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await Device.count();
    const online = await Device.count({
      where: {
        status: 'online',
        lastHeartbeat: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        }
      }
    });
    const offline = await Device.count({
      where: {
        [Op.or]: [
          { status: 'offline' },
          {
            lastHeartbeat: {
              [Op.lt]: new Date(Date.now() - 5 * 60 * 1000),
            }
          }
        ]
      }
    });
    const maintenance = await Device.count({
      where: { status: 'maintenance' }
    });
    const active = await Device.count({
      where: { isActive: true }
    });

    successResponse(res, 'Device statistics retrieved successfully', {
      total,
      online,
      offline,
      maintenance,
      active,
      inactive: total - active,
    });
  } catch (error) {
    console.error('Get device stats error:', error);
    errorResponse(res, 'Failed to retrieve device statistics', error, 500);
  }
};