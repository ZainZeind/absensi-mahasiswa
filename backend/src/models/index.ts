import sequelize from '../config/database';
import User from './User';
import Mahasiswa from './Mahasiswa';
import Dosen from './Dosen';
import MataKuliah from './MataKuliah';
import Kelas from './Kelas';
import Enrollment from './Enrollment';
import Device from './Device';
import SesiAbsensi from './SesiAbsensi';
import Absensi from './Absensi';

// Definisi Asosiasi

// User dengan Mahasiswa/Dosen (Polymorphic)
User.belongsTo(Mahasiswa, {
  foreignKey: 'profileId',
  constraints: false,
  as: 'mahasiswaProfile'
});

User.belongsTo(Dosen, {
  foreignKey: 'profileId',
  constraints: false,
  as: 'dosenProfile'
});

Mahasiswa.hasOne(User, {
  foreignKey: 'profileId',
  constraints: false,
  as: 'user'
});

Dosen.hasOne(User, {
  foreignKey: 'profileId',
  constraints: false,
  as: 'user'
});

// Kelas dengan MataKuliah
MataKuliah.hasMany(Kelas, {
  foreignKey: 'matkulId',
  as: 'kelas'
});

Kelas.belongsTo(MataKuliah, {
  foreignKey: 'matkulId',
  as: 'matkul'
});

// Kelas dengan Dosen
Dosen.hasMany(Kelas, {
  foreignKey: 'dosenId',
  as: 'kelasMengajar'
});

Kelas.belongsTo(Dosen, {
  foreignKey: 'dosenId',
  as: 'dosen'
});

// Enrollment (Many-to-Many antara Kelas dan Mahasiswa)
Kelas.belongsToMany(Mahasiswa, {
  through: Enrollment,
  foreignKey: 'kelasId',
  otherKey: 'mahasiswaId',
  as: 'mahasiswas'
});

Mahasiswa.belongsToMany(Kelas, {
  through: Enrollment,
  foreignKey: 'mahasiswaId',
  otherKey: 'kelasId',
  as: 'kelasEnrolled'
});

Mahasiswa.hasMany(Enrollment, {
  foreignKey: 'mahasiswaId',
  as: 'enrollments'
});

Kelas.hasMany(Enrollment, {
  foreignKey: 'kelasId',
  as: 'enrollments'
});

Enrollment.belongsTo(Kelas, {
  foreignKey: 'kelasId',
  as: 'kelas'
});

Enrollment.belongsTo(Mahasiswa, {
  foreignKey: 'mahasiswaId',
  as: 'mahasiswa'
});

// Device dengan Kelas
Kelas.hasOne(Device, {
  foreignKey: 'kelasId',
  as: 'device'
});

Device.belongsTo(Kelas, {
  foreignKey: 'kelasId',
  as: 'kelas'
});

// SesiAbsensi dengan Kelas
Kelas.hasMany(SesiAbsensi, {
  foreignKey: 'kelasId',
  as: 'sesiAbsensis'
});

SesiAbsensi.belongsTo(Kelas, {
  foreignKey: 'kelasId',
  as: 'kelas'
});

// SesiAbsensi dengan Dosen
Dosen.hasMany(SesiAbsensi, {
  foreignKey: 'dosenId',
  as: 'sesiAbsensis'
});

SesiAbsensi.belongsTo(Dosen, {
  foreignKey: 'dosenId',
  as: 'dosen'
});

// SesiAbsensi dengan Device
Device.hasMany(SesiAbsensi, {
  foreignKey: 'deviceId',
  as: 'sesiAbsensis'
});

SesiAbsensi.belongsTo(Device, {
  foreignKey: 'deviceId',
  as: 'device'
});

// Absensi dengan SesiAbsensi
SesiAbsensi.hasMany(Absensi, {
  foreignKey: 'sesiAbsensiId',
  as: 'absensis'
});

Absensi.belongsTo(SesiAbsensi, {
  foreignKey: 'sesiAbsensiId',
  as: 'sesiAbsensi'
});

// Absensi dengan Mahasiswa
Mahasiswa.hasMany(Absensi, {
  foreignKey: 'mahasiswaId',
  as: 'absensis'
});

Absensi.belongsTo(Mahasiswa, {
  foreignKey: 'mahasiswaId',
  as: 'mahasiswa'
});

// Absensi dengan Device
Device.hasMany(Absensi, {
  foreignKey: 'deviceId',
  as: 'absensis'
});

Absensi.belongsTo(Device, {
  foreignKey: 'deviceId',
  as: 'device'
});

// Export semua models dan sequelize instance
export {
  sequelize,
  User,
  Mahasiswa,
  Dosen,
  MataKuliah,
  Kelas,
  Enrollment,
  Device,
  SesiAbsensi,
  Absensi
};

export default sequelize;