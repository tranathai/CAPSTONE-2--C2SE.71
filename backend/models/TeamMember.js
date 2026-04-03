const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const TeamMember = sequelize.define('TeamMember', {
  team_id: { type: DataTypes.INTEGER, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, primaryKey: true, unique: true },
  is_leader: { type: DataTypes.BOOLEAN, defaultValue: false },
  joined_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'team_members',
  timestamps: false,
});

module.exports = TeamMember;