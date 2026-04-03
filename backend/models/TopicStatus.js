const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const TopicStatus = sequelize.define('TopicStatus', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, {
  tableName: 'topic_status',
  timestamps: false,
});

module.exports = TopicStatus;