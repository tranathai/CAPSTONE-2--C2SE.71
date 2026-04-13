const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const TopicTechnology = sequelize.define('TopicTechnology', {
  topic_id: { type: DataTypes.INTEGER, primaryKey: true },
  tech_id: { type: DataTypes.INTEGER, primaryKey: true },
}, {
  tableName: 'topic_technologies',
  timestamps: false,
});

module.exports = TopicTechnology;