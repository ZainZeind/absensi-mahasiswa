import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MahasiswaAttributes {
  id: number;
  nim: string;
  nama: string;
  email: string;
  jurusan: string;
  semester: number;
  fotoProfil?: string;
  fotoWajah?: string;
  nomorHp?: string;
  alamat?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MahasiswaCreationAttributes extends Optional<MahasiswaAttributes, 'id' | 'createdAt' | 'updatedAt' | 'fotoProfil' | 'fotoWajah' | 'nomorHp' | 'alamat'> {}

class Mahasiswa extends Model<MahasiswaAttributes, MahasiswaCreationAttributes> implements MahasiswaAttributes {
  public id!: number;
  public nim!: string;
  public nama!: string;
  public email!: string;
  public jurusan!: string;
  public semester!: number;
  public fotoProfil?: string;
  public fotoWajah?: string;
  public nomorHp?: string;
  public alamat?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getEnrollments?: () => Promise<any[]>;
  public getAbsensis?: () => Promise<any[]>;
}

Mahasiswa.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  nim: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  jurusan: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 14,
    },
  },
  fotoProfil: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fotoWajah: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  nomorHp: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Mahasiswa',
  tableName: 'mahasiswa',
  timestamps: true,
  underscored: true,
});

export default Mahasiswa;