import pool from "../config/db.js";

export async function findFeedbacksByVersionId(versionId) {
  const [rows] = await pool.query(
    `SELECT f.id, f.content, f.ai_summary, f.is_final, f.created_at, f.updated_at,
            u.full_name AS supervisor_name, r.name AS supervisor_role
     FROM feedbacks f
     INNER JOIN users u ON u.id = f.supervisor_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE f.submission_version_id = ?
     ORDER BY f.created_at DESC`,
    [versionId],
  );
  return rows;
}

export async function findFeedbackById(id) {
  const [rows] = await pool.query(
    `SELECT f.*, u.full_name AS supervisor_name
     FROM feedbacks f
     INNER JOIN users u ON u.id = f.supervisor_id
     WHERE f.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createFeedback({ versionId, supervisorId, content, isFinal = false }) {
  const [result] = await pool.query(
    `INSERT INTO feedbacks (submission_version_id, supervisor_id, content, is_final) VALUES (?, ?, ?, ?)`,
    [versionId, supervisorId, content, isFinal ? 1 : 0],
  );
  return result.insertId;
}

export async function updateFeedback(id, { content, isFinal }) {
  await pool.query(
    `UPDATE feedbacks SET content = COALESCE(?, content), is_final = COALESCE(?, is_final) WHERE id = ?`,
    [content, isFinal !== undefined ? (isFinal ? 1 : 0) : null, id],
  );
}

export async function findFeedbackForStudentAccess(feedbackId, userId) {
  const [rows] = await pool.query(
    `SELECT f.id, f.content, f.ai_summary
     FROM feedbacks f
     INNER JOIN submission_versions sv ON sv.id = f.submission_version_id
     INNER JOIN submissions s ON s.id = sv.submission_id
     INNER JOIN team_members tm ON tm.team_id = s.team_id AND tm.user_id = ?
     WHERE f.id = ?`,
    [userId, feedbackId],
  );
  return rows[0] || null;
}

export async function updateFeedbackAiSummary(feedbackId, aiSummary) {
  await pool.query(`UPDATE feedbacks SET ai_summary = ? WHERE id = ?`, [aiSummary, feedbackId]);
}

export async function hasFeedback(versionId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM feedbacks WHERE submission_version_id = ? LIMIT 1`,
    [versionId],
  );
  return rows.length > 0;
}
