const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  conversation_id: { type: DataTypes.INTEGER, allowNull: true },
  sender_id: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'messages',
  timestamps: false,
});

module.exports = Message;