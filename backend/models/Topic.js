const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Topic = sequelize.define('Topic', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  team_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'topics',
  timestamps: false,
});

module.exports = Topic;