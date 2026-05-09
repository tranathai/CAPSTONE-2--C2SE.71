import pool from "../config/db.js";

export async function findAllMilestones() {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, deadline_type, display_order
     FROM milestones ORDER BY display_order ASC, id ASC`,
  );
  return rows;
}

export async function findMilestoneById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, description, start_date, end_date, deadline_type, display_order
     FROM milestones WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createMilestone({ name, description, startDate, endDate, deadlineType, displayOrder }) {
  const [result] = await pool.query(
    `INSERT INTO milestones (name, description, start_date, end_date, deadline_type, display_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description || null, startDate, endDate, deadlineType || "soft", displayOrder || 0],
  );
  return result.insertId;
}

export async function updateMilestone(id, { name, description, startDate, endDate, deadlineType, displayOrder }) {
  await pool.query(
    `UPDATE milestones SET
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date),
       deadline_type = COALESCE(?, deadline_type),
       display_order = COALESCE(?, display_order)
     WHERE id = ?`,
    [name, description, startDate, endDate, deadlineType, displayOrder, id],
  );
}

export async function deleteMilestone(id) {
  await pool.query(`DELETE FROM milestones WHERE id = ?`, [id]);
}

export async function findUpcomingMilestones(limit = 5) {
  const [rows] = await pool.query(
    `SELECT id, name, end_date FROM milestones
     WHERE end_date >= NOW()
     ORDER BY end_date ASC LIMIT ?`,
    [limit],
  );
  return rows;
}
