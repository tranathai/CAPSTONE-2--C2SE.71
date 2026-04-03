const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  display_name: { type: DataTypes.STRING(100), allowNull: true },
}, {
  tableName: 'roles',
  timestamps: false,
});

module.exports = Role;