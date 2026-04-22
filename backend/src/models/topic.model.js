import pool from "../config/db.js";

export async function createTopic({
  teamId,
  studentId,
  title,
  description,
  technologiesUsed,
}) {
  const [result] = await pool.query(
    `INSERT INTO topics (team_id, student_id, title, description, technologies_used)
     VALUES (?, ?, ?, ?, ?)`,
    [teamId || null, studentId, title, description, technologiesUsed],
  );
  return result.insertId;
}

export async function listTopics({ status, studentId }) {
  let sql = `
    SELECT t.id, t.team_id, t.student_id, t.title, t.description, t.technologies_used,
      t.status, t.reviewed_by, t.rejection_reason, t.created_at, u.full_name AS student_name
    FROM topics t
    INNER JOIN users u ON u.id = t.student_id
  `;
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push("t.status = ?");
    params.push(status);
  }
  if (studentId) {
    clauses.push("t.student_id = ?");
    params.push(studentId);
  }
  if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY t.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function reviewTopic({ topicId, supervisorId, status, rejectionReason }) {
  await pool.query(
    `UPDATE topics
      SET status = ?, reviewed_by = ?, rejection_reason = ?
      WHERE id = ?`,
    [status, supervisorId, rejectionReason || null, topicId],
  );
}
