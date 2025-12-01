import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SesiAbsensi, Absensi, Mahasiswa, Device, Enrollment } from '../models';
import { successResponse, errorResponse } from '../utils/response';
import { Op } from 'sequelize';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface AuthenticatedRequest extends Request {
  user?: any;
  upload?: any;
}

// Validation rules
export const startSesiValidation = [
  body('kelasId').isInt().withMessage('Kelas ID is required'),
  body('deviceId').isInt().withMessage('Device ID is required'),
  body('judulSesi').notEmpty().withMessage('Judul sesi is required'),
  body('durasiMenit').isInt({ min: 1, max: 180 }).withMessage('Durasi must be between 1 and 180 minutes'),
];

// Generate unique session code
const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Start attendance session
export const startSesiAbsensi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errorResponse(res, 'Validation failed', errors.array());
      return;
    }

    const { kelasId, deviceId, judulSesi, durasiMenit } = req.body;
    const dosenId = req.user!.profileId;

    // Check if device exists and is online
    const device = await Device.findByPk(deviceId);
    if (!device || !device.isActive) {
      errorResponse(res, 'Device not found or inactive', null, 404);
      return;
    }

    // Check if there's already an active session for this class
    const activeSesi = await SesiAbsensi.findOne({
      where: {
        kelasId,
        isActive: true,
      },
    });

    if (activeSesi) {
      errorResponse(res, 'There is already an active session for this class');
      return;
    }

    // Create new session
    const sesiAbsensi = await SesiAbsensi.create({
      kelasId,
      dosenId,
      deviceId,
      judulSesi,
      durasiMenit,
      isActive: true,
      kodeSesi: generateSessionCode(),
    });

    // Set auto-end time
    const endTime = new Date(sesiAbsensi.waktuMulai.getTime() + durasiMenit * 60 * 1000);

    // Update device status
    await device.update({
      status: 'online',
      lastHeartbeat: new Date(),
    });

    successResponse(res, 'Attendance session started successfully', {
      sesiAbsensi,
      endTime,
    }, 201);
  } catch (error) {
    console.error('Start sesi absensi error:', error);
    errorResponse(res, 'Failed to start attendance session', error, 500);
  }
};

// Stop attendance session
export const stopSesiAbsensi = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sesiId } = req.params;

    const sesiAbsensi = await SesiAbsensi.findByPk(sesiId);
    if (!sesiAbsensi) {
      errorResponse(res, 'Session not found', null, 404);
      return;
    }

    // Check if user owns this session or is admin
    if (req.user!.role !== 'admin' && sesiAbsensi.dosenId !== req.user!.profileId) {
      errorResponse(res, 'Unauthorized to stop this session', null, 403);
      return;
    }

    await sesiAbsensi.update({
      isActive: false,
      waktuSelesai: new Date(),
    });

    successResponse(res, 'Attendance session stopped successfully', sesiAbsensi);
  } catch (error) {
    console.error('Stop sesi absensi error:', error);
    errorResponse(res, 'Failed to stop attendance session', error, 500);
  }
};

// Face recognition scan from device
export const scanFace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { device_id, image_base64 } = req.body;

    if (!device_id || !image_base64) {
      errorResponse(res, 'Device ID and image are required');
      return;
    }

    // Find device
    const device = await Device.findOne({
      where: { deviceId: device_id },
      include: [
        {
          model: SesiAbsensi,
          as: 'sesiAbsensis',
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!device || !device.isActive) {
      errorResponse(res, 'Device not found or inactive', null, 404);
      return;
    }

    // Update device heartbeat
    await device.update({
      lastHeartbeat: new Date(),
      status: 'online',
      ipAddress: req.ip,
    });

    // Check if there's an active session
    const activeSession = device.sesiAbsensis?.[0];
    if (!activeSession) {
      errorResponse(res, 'No active attendance session', null, 400);
      return;
    }

    // Call external face recognition API
    try {
      const faceRecognitionResult = await callFaceRecognitionAPI(image_base64, device_id);

      if (!faceRecognitionResult.success || !faceRecognitionResult.mahasiswa_id) {
        successResponse(res, 'Face scan completed - no match found', {
          success: false,
          message: 'Wajah tidak dikenali',
          confidence: faceRecognitionResult.confidence || 0,
        });
        return;
      }

      // Find mahasiswa
      const mahasiswa = await Mahasiswa.findByPk(faceRecognitionResult.mahasiswa_id);
      if (!mahasiswa) {
        errorResponse(res, 'Mahasiswa not found', null, 404);
        return;
      }

      // Check if mahasiswa is enrolled in this class
      const enrollment = await Enrollment.findOne({
        where: {
          kelasId: activeSession.kelasId,
          mahasiswaId: mahasiswa.id,
          isActive: true,
        },
      });

      if (!enrollment) {
        errorResponse(res, 'Mahasiswa not enrolled in this class', null, 403);
        return;
      }

      // Check if already marked as present
      const existingAbsensi = await Absensi.findOne({
        where: {
          sesiAbsensiId: activeSession.id,
          mahasiswaId: mahasiswa.id,
        },
      });

      if (existingAbsensi) {
        successResponse(res, 'Already marked as present', {
          success: true,
          message: 'Sudah melakukan absensi',
          absensi: existingAbsensi,
        });
        return;
      }

      // Create attendance record
      const absensi = await Absensi.create({
        sesiAbsensiId: activeSession.id,
        mahasiswaId: mahasiswa.id,
        status: 'hadir',
        lokasiAbsen: `${device.lokasi} - ${device.ruang}`,
        confidence: faceRecognitionResult.confidence,
        fotoWajah: faceRecognitionResult.foto_url || null,
        deviceId: device.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        isValidated: true, // Auto-validate if confidence is high enough
        keterangan: `Face recognition scan via device ${device_id}`,
      });

      successResponse(res, 'Face recognition successful', {
        success: true,
        message: 'Absensi berhasil',
        mahasiswa: {
          id: mahasiswa.id,
          nim: mahasiswa.nim,
          nama: mahasiswa.nama,
        },
        absensi,
        confidence: faceRecognitionResult.confidence,
      });
    } catch (faceError) {
      console.error('Face recognition API error:', faceError);
      errorResponse(res, 'Face recognition service unavailable', faceError, 503);
    }
  } catch (error) {
    console.error('Scan face error:', error);
    errorResponse(res, 'Failed to scan face', error, 500);
  }
};

// Get active sessions
export const getActiveSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let whereClause: any = { isActive: true };

    // Filter by dosen if not admin
    if (req.user!.role !== 'admin') {
      whereClause.dosenId = req.user!.profileId;
    }

    const sessions = await SesiAbsensi.findAll({
      where: whereClause,
      include: [
        {
          model: Mahasiswa.sequelize!.models.Kelas,
          as: 'kelas',
          include: [
            {
              model: Mahasiswa.sequelize!.models.MataKuliah,
              as: 'matkul',
              attributes: ['id', 'kode', 'nama', 'sks'],
            },
          ],
        },
        {
          model: Mahasiswa.sequelize!.models.Device,
          as: 'device',
          attributes: ['id', 'nama', 'lokasi', 'ruang', 'status'],
        },
      ],
      order: [['waktuMulai', 'DESC']],
    });

    successResponse(res, 'Active sessions retrieved successfully', sessions);
  } catch (error) {
    console.error('Get active sessions error:', error);
    errorResponse(res, 'Failed to retrieve active sessions', error, 500);
  }
};

// Get session attendance data
export const getSessionAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sesiId } = req.params;

    const sesi = await SesiAbsensi.findByPk(sesiId, {
      include: [
        {
          model: Mahasiswa.sequelize!.models.Kelas,
          as: 'kelas',
          include: [
            {
              model: Mahasiswa.sequelize!.models.MataKuliah,
              as: 'matkul',
            },
            {
              model: Mahasiswa,
              as: 'mahasiswas',
              through: { attributes: [] },
              attributes: ['id', 'nim', 'nama', 'email'],
            },
          ],
        },
      ],
    });

    if (!sesi) {
      errorResponse(res, 'Session not found', null, 404);
      return;
    }

    // Get attendance records
    const absensis = await Absensi.findAll({
      where: { sesiAbsensiId: sesiId },
      include: [
        {
          model: Mahasiswa,
          as: 'mahasiswa',
          attributes: ['id', 'nim', 'nama', 'email'],
        },
      ],
      order: [['waktuAbsen', 'ASC']],
    });

    // Calculate statistics
    const enrolledMahasiswa = sesi.kelas?.mahasiswas || [];
    const presentMahasiswa = absensis.filter(a => a.status === 'hadir').map(a => a.mahasiswa!.id);

    const stats = {
      totalEnrolled: enrolledMahasiswa.length,
      present: presentMahasiswa.length,
      absent: enrolledMahasiswa.length - presentMahasiswa.length,
      percentage: enrolledMahasiswa.length > 0 ? (presentMahasiswa.length / enrolledMahasiswa.length) * 100 : 0,
    };

    successResponse(res, 'Session attendance retrieved successfully', {
      sesi,
      absensis,
      stats,
    });
  } catch (error) {
    console.error('Get session attendance error:', error);
    errorResponse(res, 'Failed to retrieve session attendance', error, 500);
  }
};

// External face recognition API call
const callFaceRecognitionAPI = async (imageBase64: string, deviceId: string) => {
  try {
    // In production, this would call an actual face recognition service
    // For now, we'll simulate the API call

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate face recognition result
    // In real implementation, this would use OpenCV, FaceNet, or similar
    const mockResult = {
      success: Math.random() > 0.2, // 80% success rate for simulation
      mahasiswa_id: Math.random() > 0.2 ? Math.floor(Math.random() * 100) + 1 : null,
      confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0 confidence
      foto_url: `/uploads/faces/${Date.now()}.jpg`,
      processing_time_ms: Math.floor(Math.random() * 2000) + 500,
    };

    console.log(`Face recognition for device ${deviceId}:`, mockResult);
    return mockResult;

    /* Real implementation would look something like this:
    const response = await axios.post(process.env.FACE_RECOGNITION_ENDPOINT!, {
      image: imageBase64,
      device_id: deviceId,
      threshold: 0.8,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.FACE_RECOGNITION_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
    */
  } catch (error) {
    console.error('Face recognition API call failed:', error);
    throw error;
  }
};

// Manual attendance mark (for izin/sakit)
export const markManualAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sesiId } = req.params;
    const { mahasiswaId, status, keterangan } = req.body;

    if (!['izin', 'sakit'].includes(status)) {
      errorResponse(res, 'Status must be "izin" or "sakit"');
      return;
    }

    // Check session exists and user has permission
    const sesi = await SesiAbsensi.findByPk(sesiId);
    if (!sesi) {
      errorResponse(res, 'Session not found', null, 404);
      return;
    }

    if (req.user!.role !== 'admin' && sesi.dosenId !== req.user!.profileId) {
      errorResponse(res, 'Unauthorized to mark attendance for this session', null, 403);
      return;
    }

    // Check if attendance already exists
    const existingAbsensi = await Absensi.findOne({
      where: {
        sesiAbsensiId: sesiId,
        mahasiswaId,
      },
    });

    if (existingAbsensi) {
      errorResponse(res, 'Attendance already marked for this student');
      return;
    }

    // Create manual attendance record
    const absensi = await Absensi.create({
      sesiAbsensiId: sesiId,
      mahasiswaId,
      status,
      deviceId: sesi.deviceId,
      isValidated: true,
      keterangan,
    });

    successResponse(res, 'Manual attendance marked successfully', absensi, 201);
  } catch (error) {
    console.error('Mark manual attendance error:', error);
    errorResponse(res, 'Failed to mark manual attendance', error, 500);
  }
};