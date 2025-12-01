import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DeviceAttributes {
  id: number;
  deviceId: string;
  nama: string;
  lokasi: string;
  ruang: string;
  kelasId?: number;
  isActive: boolean;
  lastHeartbeat?: Date;
  ipAddress?: string;
  status: 'online' | 'offline' | 'maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}

interface DeviceCreationAttributes extends Optional<DeviceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'kelasId' | 'lastHeartbeat' | 'ipAddress' | 'status'> {}

class Device extends Model<DeviceAttributes, DeviceCreationAttributes> implements DeviceAttributes {
  public id!: number;
  public deviceId!: string;
  public nama!: string;
  public lokasi!: string;
  public ruang!: string;
  public kelasId?: number;
  public isActive!: boolean;
  public lastHeartbeat?: Date;
  public ipAddress?: string;
  public status!: 'online' | 'offline' | 'maintenance';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getKelas?: () => Promise<any>;
  public getSesiAbsensis?: () => Promise<any[]>;
}

Device.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lokasi: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ruang: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  kelasId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'kelas',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'maintenance'),
    allowNull: false,
    defaultValue: 'offline',
  },
}, {
  sequelize,
  modelName: 'Device',
  tableName: 'devices',
  timestamps: true,
  underscored: true,
});

export default Device;