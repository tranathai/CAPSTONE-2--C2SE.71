const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: { type: DataTypes.INTEGER, allowNull: true },
  milestone_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'submissions',
  timestamps: false,
});

module.exports = Submission;