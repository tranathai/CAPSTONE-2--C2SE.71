import pool from "../config/db.js";

export async function findAllTeams() {
  const sql = `
    SELECT id, name
    FROM teams
    ORDER BY name ASC, id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}
