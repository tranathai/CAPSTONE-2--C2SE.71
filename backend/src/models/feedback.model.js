import pool from "../config/db.js";

export async function findFeedbacksByVersionId(versionId) {
  const sql = `
    SELECT
      f.id,
      f.submission_version_id,
      f.supervisor_id,
      u.full_name AS supervisor_name,
      f.content,
      f.created_at
    FROM feedbacks f
    INNER JOIN users u
      ON u.id = f.supervisor_id
    WHERE f.submission_version_id = ?
    ORDER BY f.created_at DESC, f.id DESC
  `;

  const [rows] = await pool.query(sql, [versionId]);
  return rows;
}

export async function createFeedback({
  submissionVersionId,
  supervisorId,
  content,
}) {
  const sql = `
    INSERT INTO feedbacks (submission_version_id, supervisor_id, content)
    VALUES (?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    submissionVersionId,
    supervisorId,
    content,
  ]);

  return result.insertId;
}

export async function findUserRoleById(userId) {
  const sql = `
    SELECT r.name AS role_name
    FROM users u
    INNER JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [userId]);
  return rows[0]?.role_name || null;
}

export async function doesSubmissionVersionExist(versionId) {
  const sql = `
    SELECT id
    FROM submission_versions
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [versionId]);
  return rows.length > 0;
}
