const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const RiskLevel = sequelize.define('RiskLevel', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, {
  tableName: 'risk_levels',
  timestamps: false,
});

module.exports = RiskLevel;