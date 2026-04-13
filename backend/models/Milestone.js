const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Milestone = sequelize.define('Milestone', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  end_date: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: 'milestones',
  timestamps: false,
});

module.exports = Milestone;