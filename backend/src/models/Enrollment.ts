import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EnrollmentAttributes {
  id: number;
  kelasId: number;
  mahasiswaId: number;
  tanggalEnroll: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'tanggalEnroll' | 'isActive'> {}

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  public id!: number;
  public kelasId!: number;
  public mahasiswaId!: number;
  public tanggalEnroll!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getKelas?: () => Promise<any>;
  public getMahasiswa?: () => Promise<any>;
  public getAbsensis?: () => Promise<any[]>;
}

Enrollment.init({
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
  tanggalEnroll: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'Enrollment',
  tableName: 'enrollment',
  timestamps: true,
  underscored: true,
  // Unique constraint untuk mencegah double enrollment
  indexes: [
    {
      unique: true,
      fields: ['kelas_id', 'mahasiswa_id']
    }
  ]
});

export default Enrollment;