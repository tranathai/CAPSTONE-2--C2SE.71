const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const ConversationMember = sequelize.define('ConversationMember', {
  conversation_id: { type: DataTypes.INTEGER, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, primaryKey: true },
}, {
  tableName: 'conversation_members',
  timestamps: false,
});

module.exports = ConversationMember;