import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AbsensiAttributes {
  id: number;
  sesiAbsensiId: number;
  mahasiswaId: number;
  waktuAbsen: Date;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  lokasiAbsen?: string;
  confidence?: number;
  fotoWajah?: string;
  deviceId: number;
  ipAddress?: string;
  userAgent?: string;
  isValidated: boolean;
  keterangan?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AbsensiCreationAttributes extends Optional<AbsensiAttributes, 'id' | 'createdAt' | 'updatedAt' | 'lokasiAbsen' | 'confidence' | 'fotoWajah' | 'ipAddress' | 'userAgent' | 'keterangan' | 'isValidated'> {}

class Absensi extends Model<AbsensiAttributes, AbsensiCreationAttributes> implements AbsensiAttributes {
  public id!: number;
  public sesiAbsensiId!: number;
  public mahasiswaId!: number;
  public waktuAbsen!: Date;
  public status!: 'hadir' | 'izin' | 'sakit' | 'alfa';
  public lokasiAbsen?: string;
  public confidence?: number;
  public fotoWajah?: string;
  public deviceId!: number;
  public ipAddress?: string;
  public userAgent?: string;
  public isValidated!: boolean;
  public keterangan?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getSesiAbsensi?: () => Promise<any>;
  public getMahasiswa?: () => Promise<any>;
  public getDevice?: () => Promise<any>;
}

Absensi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  sesiAbsensiId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'sesi_absensi',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  mahasiswaId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'mahasiswa',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  waktuAbsen: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('hadir', 'izin', 'sakit', 'alfa'),
    allowNull: false,
    defaultValue: 'hadir',
  },
  lokasiAbsen: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    validate: {
      min: 0,
      max: 1,
    },
  },
  fotoWajah: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  deviceId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isValidated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Absensi',
  tableName: 'absensi',
  timestamps: true,
  underscored: true,
  // Unique constraint untuk mencegah double absensi dalam satu sesi
  indexes: [
    {
      unique: true,
      fields: ['sesi_absensi_id', 'mahasiswa_id']
    }
  ]
});

export default Absensi;