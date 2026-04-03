const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/mysql');

const Technology = sequelize.define('Technology', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, {
  tableName: 'technologies',
  timestamps: false,
});

module.exports = Technology;