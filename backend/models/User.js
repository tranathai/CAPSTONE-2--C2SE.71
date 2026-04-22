const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  avatar: { type: DataTypes.STRING(255), allowNull: true },
  role_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
