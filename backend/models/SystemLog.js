const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const SystemLog = sequelize.define('SystemLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING(255), allowNull: true },
  ip_address: { type: DataTypes.STRING(50), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'system_logs',
  timestamps: false,
});

module.exports = SystemLog;