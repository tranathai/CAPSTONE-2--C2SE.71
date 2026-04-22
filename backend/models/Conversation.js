const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'conversations',
  timestamps: false,
});

module.exports = Conversation;