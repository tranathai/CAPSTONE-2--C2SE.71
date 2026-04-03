const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'MentorAIGrad',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'admin',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    define: {
      underscored: true,
      timestamps: false,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}`);
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };