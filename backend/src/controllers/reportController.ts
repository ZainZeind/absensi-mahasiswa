import { Request, Response } from 'express';
import { Absensi, Mahasiswa, Dosen, Kelas, MataKuliah, SesiAbsensi, Enrollment, Device } from '../models';
import { successResponse, errorResponse } from '../utils/response';
import { Op, fn, col, literal } from 'sequelize';
import { format } from 'date-fns';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Dashboard Statistics
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { role, profileId } = req.user!;
    let stats: any = {};

    // Base statistics
    const totalMahasiswa = await Mahasiswa.count({ where: {} });
    const totalDosen = await Dosen.count({ where: {} });
    const totalMataKuliah = await MataKuliah.count({ where: {} });
    const totalKelas = await Kelas.count({ where: {} });
    const totalDevices = await Device.count({ where: {} });
    const activeDevices = await Device.count({
      where: {
        status: 'online',
        lastHeartbeat: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        }
      }
    });

    // Attendance statistics for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await SesiAbsensi.findAll({
      where: {
        waktuMulai: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        }
      },
      include: [
        {
          model: Absensi,
          as: 'absensis',
          required: false,
        },
      ],
    });

    const todayTotalAbsensi = todaySessions.reduce((acc, session) => acc + session.absensis!.length, 0);
    const todayHadir = todaySessions.reduce((acc, session) =>
      acc + session.absensis!.filter(abs => abs.status === 'hadir').length, 0
    );

    stats.base = {
      totalMahasiswa,
      totalDosen,
      totalMataKuliah,
      totalKelas,
      totalDevices,
      activeDevices,
    };

    stats.today = {
      totalSessions: todaySessions.length,
      totalAbsensi: todayTotalAbsensi,
      hadir: todayHadir,
      alfa: todayTotalAbsensi - todayHadir,
      hadirPercentage: todayTotalAbsensi > 0 ? (todayHadir / todayTotalAbsensi) * 100 : 0,
    };

    // Role-specific statistics
    if (role === 'admin') {
      // Admin gets all data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlySessions = await SesiAbsensi.count({
        where: {
          waktuMulai: {
            [Op.gte]: thisMonth,
          }
        }
      });

      const monthlyAbsensi = await Absensi.count({
        where: {
          waktuAbsen: {
            [Op.gte]: thisMonth,
          }
        }
      });

      stats.monthly = {
        totalSessions: monthlySessions,
        totalAbsensi: monthlyAbsensi,
      };

      // Get recent activities
      const recentAbsensis = await Absensi.findAll({
        limit: 10,
        order: [['waktuAbsen', 'DESC']],
        include: [
          {
            model: Mahasiswa,
            as: 'mahasiswa',
            attributes: ['id', 'nim', 'nama'],
          },
          {
            model: SesiAbsensi,
            as: 'sesiAbsensi',
            attributes: ['id', 'judulSesi'],
            include: [
              {
                model: Kelas,
                as: 'kelas',
                attributes: ['nama', 'ruang'],
              },
            ],
          },
        ],
      });

      stats.recentActivities = recentAbsensis;

    } else if (role === 'dosen') {
      // Dosen gets their class statistics
      const dosenClasses = await Kelas.findAll({
        where: { dosenId: profileId },
        include: [
          {
            model: SesiAbsensi,
            as: 'sesiAbsensis',
            where: {
              waktuMulai: {
                [Op.gte]: today,
                [Op.lt]: tomorrow,
              }
            },
            include: [
              {
                model: Absensi,
                as: 'absensis',
                required: false,
              },
            ],
            required: false,
          },
        ],
      });

      const dosenTodaySessions = dosenClasses.reduce((acc, kelas) =>
        acc + kelas.sesiAbsensis!.length, 0
      );

      const dosenTodayAbsensi = dosenClasses.reduce((acc, kelas) =>
        acc + kelas.sesiAbsensis!.reduce((sum, session) => sum + session.absensis!.length, 0), 0
      );

      const dosenTodayHadir = dosenClasses.reduce((acc, kelas) =>
        acc + kelas.sesiAbsensis!.reduce((sum, session) =>
          sum + session.absensis!.filter(abs => abs.status === 'hadir').length, 0), 0
      );

      stats.dosen = {
        totalClasses: dosenClasses.length,
        todaySessions: dosenTodaySessions,
        todayAbsensi: dosenTodayAbsensi,
        todayHadir: dosenTodayHadir,
        todayHadirPercentage: dosenTodayAbsensi > 0 ? (dosenTodayHadir / dosenTodayAbsensi) * 100 : 0,
        classes: dosenClasses,
      };

    } else if (role === 'mahasiswa') {
      // Mahasiswa gets their attendance statistics
      const mahasiswaAbsensis = await Absensi.findAll({
        where: { mahasiswaId: profileId },
        order: [['waktuAbsen', 'DESC']],
        limit: 50,
        include: [
          {
            model: SesiAbsensi,
            as: 'sesiAbsensi',
            attributes: ['id', 'judulSesi', 'waktuMulai'],
            include: [
              {
                model: Kelas,
                as: 'kelas',
                attributes: ['nama', 'ruang'],
                include: [
                  {
                    model: MataKuliah,
                    as: 'matkul',
                    attributes: ['kode', 'nama'],
                  },
                ],
              },
            ],
          },
        ],
      });

      const hadirCount = mahasiswaAbsensis.filter(abs => abs.status === 'hadir').length;
      const izinCount = mahasiswaAbsensis.filter(abs => abs.status === 'izin').length;
      const sakitCount = mahasiswaAbsensis.filter(abs => abs.status === 'sakit').length;
      const alfaCount = mahasiswaAbsensis.filter(abs => abs.status === 'alfa').length;

      stats.mahasiswa = {
        totalAbsensi: mahasiswaAbsensis.length,
        hadir: hadirCount,
        izin: izinCount,
        sakit: sakitCount,
        alfa: alfaCount,
        hadirPercentage: mahasiswaAbsensis.length > 0 ? (hadirCount / mahasiswaAbsensis.length) * 100 : 0,
        recentAbsensis: mahasiswaAbsensis.slice(0, 10),
      };

      // Get enrolled classes
      const enrolledClasses = await Enrollment.findAll({
        where: {
          mahasiswaId: profileId,
          isActive: true,
        },
        include: [
          {
            model: Kelas,
            as: 'kelas',
            attributes: ['id', 'nama', 'ruang', 'hari', 'jamMulai', 'jamSelesai'],
            include: [
              {
                model: MataKuliah,
                as: 'matkul',
                attributes: ['kode', 'nama', 'sks'],
              },
              {
                model: Dosen,
                as: 'dosen',
                attributes: ['id', 'nama', 'nidn'],
              },
            ],
          },
        ],
      });

      stats.mahasiswa.enrolledClasses = enrolledClasses.map(enrollment => enrollment.kelas);
    }

    successResponse(res, 'Dashboard statistics retrieved successfully', stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    errorResponse(res, 'Failed to retrieve dashboard statistics', error, 500);
  }
};

// Attendance Report by Class
export const getClassAttendanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kelasId } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.waktuAbsen = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    // Get class details
    const kelas = await Kelas.findByPk(kelasId, {
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
          through: { attributes: [] },
          attributes: ['id', 'nim', 'nama', 'email', 'jurusan'],
        },
      ],
    });

    if (!kelas) {
      errorResponse(res, 'Class not found', null, 404);
      return;
    }

    // Get sessions for this class
    const sessions = await SesiAbsensi.findAll({
      where: {
        kelasId,
        ...(startDate && endDate && {
          waktuMulai: {
            [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
          }
        })
      },
      order: [['waktuMulai', 'DESC']],
    });

    // Get attendance records
    const attendances = await Absensi.findAll({
      where: {
        sesiAbsensiId: sessions.map(s => s.id),
        ...whereClause,
      },
      include: [
        {
          model: Mahasiswa,
          as: 'mahasiswa',
          attributes: ['id', 'nim', 'nama'],
        },
        {
          model: SesiAbsensi,
          as: 'sesiAbsensi',
          attributes: ['id', 'judulSesi', 'waktuMulai'],
        },
      ],
      order: [['waktuAbsen', 'ASC']],
    });

    // Process attendance data by student
    const mahasiswaAttendance = kelas.mahasiswas!.map(mahasiswa => {
      const mahasiswaAttendances = attendances.filter(abs => abs.mahasiswaId === mahasiswa.id);
      const hadir = mahasiswaAttendances.filter(abs => abs.status === 'hadir').length;
      const izin = mahasiswaAttendances.filter(abs => abs.status === 'izin').length;
      const sakit = mahasiswaAttendances.filter(abs => abs.status === 'sakit').length;
      const alfa = mahasiswaAttendances.filter(abs => abs.status === 'alfa').length;
      const totalSessions = sessions.length;
      const kehadiranPersentase = totalSessions > 0 ? (hadir / totalSessions) * 100 : 0;

      return {
        mahasiswa,
        statistik: {
          totalSesi: totalSessions,
          hadir,
          izin,
          sakit,
          alfa,
          kehadiranPersentase: kehadiranPersentase.toFixed(2),
        },
        detailAbsensi: mahasiswaAttendances,
      };
    });

    const reportData = {
      kelas,
      periode: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      sesi: sessions,
      rekapKehadiran: mahasiswaAttendance,
      statistikKeseluruhan: {
        totalMahasiswa: kelas.mahasiswas!.length,
        totalSesi: sessions.length,
        totalAbsensi: attendances.length,
        rataRataKehadiran: mahasiswaAttendance.reduce((acc, curr) =>
          acc + parseFloat(curr.statistik.kehadiranPersentase), 0) / mahasiswaAttendance.length,
      },
    };

    if (format === 'json') {
      successResponse(res, 'Class attendance report retrieved successfully', reportData);
    } else {
      // For Excel/PDF export, you would implement file generation here
      errorResponse(res, 'Export format not implemented yet', null, 501);
    }
  } catch (error) {
    console.error('Get class attendance report error:', error);
    errorResponse(res, 'Failed to retrieve class attendance report', error, 500);
  }
};

// Attendance Report by Mahasiswa
export const getMahasiswaAttendanceReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mahasiswaId } = req.params;
    const { startDate, endDate } = req.query;

    // Get mahasiswa details
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          where: { isActive: true },
          include: [
            {
              model: Kelas,
              as: 'kelas',
              include: [
                {
                  model: MataKuliah,
                  as: 'matkul',
                },
                {
                  model: Dosen,
                  as: 'dosen',
                },
              ],
            },
          ],
        },
      ],
    });

    if (!mahasiswa) {
      errorResponse(res, 'Mahasiswa not found', null, 404);
      return;
    }

    // Get attendance records
    const whereClause: any = { mahasiswaId };
    if (startDate && endDate) {
      whereClause.waktuAbsen = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const attendances = await Absensi.findAll({
      where: whereClause,
      include: [
        {
          model: SesiAbsensi,
          as: 'sesiAbsensi',
          include: [
            {
              model: Kelas,
              as: 'kelas',
              include: [
                {
                  model: MataKuliah,
                  as: 'matkul',
                },
              ],
            },
          ],
        },
      ],
      order: [['waktuAbsen', 'DESC']],
    });

    // Group by class/mata kuliah
    const attendanceByClass = attendances.reduce((acc: any, attendance) => {
      const matkulId = attendance.sesiAbsensi.kelas.matkulId;
      const matkulName = attendance.sesiAbsensi.kelas.matkul.nama;

      if (!acc[matkulId]) {
        acc[matkulId] = {
          mataKuliah: attendance.sesiAbsensi.kelas.matkul,
          kelas: attendance.sesiAbsensi.kelas,
          attendances: [],
          statistik: { hadir: 0, izin: 0, sakit: 0, alfa: 0 },
        };
      }

      acc[matkulId].attendances.push(attendance);
      acc[matkulId].statistik[attendance.status]++;

      return acc;
    }, {});

    // Calculate percentages
    Object.keys(attendanceByClass).forEach(matkulId => {
      const data = attendanceByClass[matkulId];
      const total = data.statistik.hadir + data.statistik.izin + data.statistik.sakit + data.statistik.alfa;
      data.statistik.kehadiranPersentase = total > 0 ? ((data.statistik.hadir / total) * 100).toFixed(2) : '0';
    });

    const reportData = {
      mahasiswa,
      periode: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      rekapPerMatkul: Object.values(attendanceByClass),
      statistikKeseluruhan: {
        totalKelas: Object.keys(attendanceByClass).length,
        totalAbsensi: attendances.length,
        hadir: attendances.filter(a => a.status === 'hadir').length,
        izin: attendances.filter(a => a.status === 'izin').length,
        sakit: attendances.filter(a => a.status === 'sakit').length,
        alfa: attendances.filter(a => a.status === 'alfa').length,
        kehadiranPersentase: attendances.length > 0 ?
          ((attendances.filter(a => a.status === 'hadir').length / attendances.length) * 100).toFixed(2) : '0',
      },
    };

    successResponse(res, 'Mahasiswa attendance report retrieved successfully', reportData);
  } catch (error) {
    console.error('Get mahasiswa attendance report error:', error);
    errorResponse(res, 'Failed to retrieve mahasiswa attendance report', error, 500);
  }
};

// Export Report
export const exportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, id } = req.params; // type: 'class' | 'mahasiswa', id: respective ID
    const { format = 'excel', startDate, endDate } = req.query;

    // This is where you would implement Excel/PDF generation
    // For now, we'll just return the data

    if (type === 'class') {
      req.params.kelasId = id;
      req.query.format = 'json';
      return getClassAttendanceReport(req, res);
    } else if (type === 'mahasiswa') {
      req.params.mahasiswaId = id;
      req.query.format = 'json';
      return getMahasiswaAttendanceReport(req, res);
    }

    errorResponse(res, 'Invalid report type', null, 400);
  } catch (error) {
    console.error('Export report error:', error);
    errorResponse(res, 'Failed to export report', error, 500);
  }
};