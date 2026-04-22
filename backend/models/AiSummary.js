const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const AiSummary = sequelize.define('AiSummary', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  entity_type: { type: DataTypes.ENUM('feedback', 'submission'), allowNull: true },
  entity_id: { type: DataTypes.INTEGER, allowNull: true },
  summary: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'ai_summaries',
  timestamps: false,
});

module.exports = AiSummary;