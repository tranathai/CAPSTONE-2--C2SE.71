const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Team = sequelize.define('Team', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: true },
  invite_code: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'teams',
  timestamps: false,
});

module.exports = Team;