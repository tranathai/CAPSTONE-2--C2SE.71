const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const RiskFlag = sequelize.define('RiskFlag', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: { type: DataTypes.INTEGER, allowNull: true },
  risk_level_id: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'risk_flags',
  timestamps: false,
});

module.exports = RiskFlag;