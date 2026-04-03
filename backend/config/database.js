const mysql = require('mysql2/promise');

let pool;

const connectDB = async () => {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'MentorAIGrad',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    queueLimit: 0
  });

  await pool.query('SELECT 1');
  console.log('MySQL Connected');
  return pool;
};

const getPool = () => pool;

module.exports = {
  connectDB,
  getPool
};
