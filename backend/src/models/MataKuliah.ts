import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MataKuliahAttributes {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jurusan: string;
  deskripsi?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MataKuliahCreationAttributes extends Optional<MataKuliahAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deskripsi'> {}

class MataKuliah extends Model<MataKuliahAttributes, MataKuliahCreationAttributes> implements MataKuliahAttributes {
  public id!: number;
  public kode!: string;
  public nama!: string;
  public sks!: number;
  public semester!: number;
  public jurusan!: string;
  public deskripsi?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getEnrollments?: () => Promise<any[]>;
  public getKelas?: () => Promise<any[]>;
}

MataKuliah.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  kode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  sks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 6,
    },
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 14,
    },
  },
  jurusan: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'MataKuliah',
  tableName: 'mata_kuliah',
  timestamps: true,
  underscored: true,
});

export default MataKuliah;