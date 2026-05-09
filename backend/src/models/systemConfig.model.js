import pool from "../config/db.js";

export async function getConfig(key) {
  const [rows] = await pool.query(
    `SELECT config_value FROM system_config WHERE config_key = ?`,
    [key],
  );
  return rows[0]?.config_value ?? null;
}

export async function setConfig(key, value, description) {
  await pool.query(
    `INSERT INTO system_config (config_key, config_value, description)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = COALESCE(VALUES(description), description)`,
    [key, value, description || null],
  );
}

export async function listConfig() {
  const [rows] = await pool.query(
    `SELECT id, config_key, config_value, description, updated_at FROM system_config ORDER BY config_key`,
  );
  return rows;
}
