const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  submission_version_id: { type: DataTypes.INTEGER, allowNull: true },
  supervisor_id: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'feedbacks',
  timestamps: false,
});

module.exports = Feedback;