const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const TopicReview = sequelize.define('TopicReview', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  topic_id: { type: DataTypes.INTEGER, allowNull: true },
  supervisor_id: { type: DataTypes.INTEGER, allowNull: true },
  status_id: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'topic_reviews',
  timestamps: false,
});

module.exports = TopicReview;