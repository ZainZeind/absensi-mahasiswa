import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DosenAttributes {
  id: number;
  nidn: string;
  nama: string;
  email: string;
  jurusan: string;
  fotoProfil?: string;
  nomorHp?: string;
  alamat?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DosenCreationAttributes extends Optional<DosenAttributes, 'id' | 'createdAt' | 'updatedAt' | 'fotoProfil' | 'nomorHp' | 'alamat'> {}

class Dosen extends Model<DosenAttributes, DosenCreationAttributes> implements DosenAttributes {
  public id!: number;
  public nidn!: string;
  public nama!: string;
  public email!: string;
  public jurusan!: string;
  public fotoProfil?: string;
  public nomorHp?: string;
  public alamat?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getMatkulAjar?: () => Promise<any[]>;
  public getSesiAbsensis?: () => Promise<any[]>;
}

Dosen.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  nidn: {
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
  fotoProfil: {
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
  modelName: 'Dosen',
  tableName: 'dosen',
  timestamps: true,
  underscored: true,
});

export default Dosen;