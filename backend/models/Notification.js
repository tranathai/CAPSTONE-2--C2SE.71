const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING(50), allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'notifications',
  timestamps: false,
});

module.exports = Notification;