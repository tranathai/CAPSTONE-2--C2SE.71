const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const SubmissionVersion = sequelize.define('SubmissionVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  submission_id: { type: DataTypes.INTEGER, allowNull: true },
  file_path: { type: DataTypes.STRING(255), allowNull: true },
  file_name: { type: DataTypes.STRING(255), allowNull: true },
  version_number: { type: DataTypes.INTEGER, allowNull: true },
  submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('on-time', 'late'), allowNull: true },
}, {
  tableName: 'submission_versions',
  timestamps: false,
});

module.exports = SubmissionVersion;