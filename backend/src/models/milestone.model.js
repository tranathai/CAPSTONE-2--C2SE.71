import pool from "../config/db.js";

export async function findAllMilestones() {
  const sql = `
    SELECT id, name
    FROM milestones
    ORDER BY id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}
