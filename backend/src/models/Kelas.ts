import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface KelasAttributes {
  id: number;
  nama: string;
  matkulId: number;
  dosenId: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  kapasitas: number;
  tahunAjaran: string;
  semester: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface KelasCreationAttributes extends Optional<KelasAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Kelas extends Model<KelasAttributes, KelasCreationAttributes> implements KelasAttributes {
  public id!: number;
  public nama!: string;
  public matkulId!: number;
  public dosenId!: number;
  public hari!: string;
  public jamMulai!: string;
  public jamSelesai!: string;
  public ruang!: string;
  public kapasitas!: number;
  public tahunAjaran!: string;
  public semester!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getMatkul?: () => Promise<any>;
  public getDosen?: () => Promise<any>;
  public getEnrollments?: () => Promise<any[]>;
  public getSesiAbsensis?: () => Promise<any[]>;
}

Kelas.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  nama: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  matkulId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'mata_kuliah',
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
  hari: {
    type: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'),
    allowNull: false,
  },
  jamMulai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  jamSelesai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  ruang: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  kapasitas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  tahunAjaran: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  semester: {
    type: DataTypes.ENUM('Ganjil', 'Genap'),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Kelas',
  tableName: 'kelas',
  timestamps: true,
  underscored: true,
});

export default Kelas;