import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mentor_ai_grad",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function checkDbConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

export default pool;
