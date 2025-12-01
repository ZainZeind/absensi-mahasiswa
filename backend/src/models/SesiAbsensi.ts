import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SesiAbsensiAttributes {
  id: number;
  kelasId: number;
  dosenId: number;
  deviceId: number;
  judulSesi: string;
  waktuMulai: Date;
  waktuSelesai?: Date;
  durasiMenit: number;
  isActive: boolean;
  kodeSesi: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SesiAbsensiCreationAttributes extends Optional<SesiAbsensiAttributes, 'id' | 'createdAt' | 'updatedAt' | 'waktuSelesai' | 'isActive'> {}

class SesiAbsensi extends Model<SesiAbsensiAttributes, SesiAbsensiCreationAttributes> implements SesiAbsensiAttributes {
  public id!: number;
  public kelasId!: number;
  public dosenId!: number;
  public deviceId!: number;
  public judulSesi!: string;
  public waktuMulai!: Date;
  public waktuSelesai?: Date;
  public durasiMenit!: number;
  public isActive!: boolean;
  public kodeSesi!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getKelas?: () => Promise<any>;
  public getDosen?: () => Promise<any>;
  public getDevice?: () => Promise<any>;
  public getAbsensis?: () => Promise<any[]>;
}

SesiAbsensi.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  kelasId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'kelas',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  dosenId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'dosen',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
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
  judulSesi: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  waktuMulai: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  waktuSelesai: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  durasiMenit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15,
    validate: {
      min: 1,
      max: 180,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  kodeSesi: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
}, {
  sequelize,
  modelName: 'SesiAbsensi',
  tableName: 'sesi_absensi',
  timestamps: true,
  underscored: true,
});

export default SesiAbsensi;