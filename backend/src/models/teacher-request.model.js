import pool from "../config/db.js";

let teacherRequestMetaPromise;

async function getTeacherRequestMeta() {
  if (!teacherRequestMetaPromise) {
    teacherRequestMetaPromise = pool
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          userNameCol: names.has("full_name") ? "full_name" : names.has("name") ? "name" : "email",
        };
      })
      .catch((error) => {
        teacherRequestMetaPromise = null;
        throw error;
      });
  }
  return teacherRequestMetaPromise;
}

export async function createTeacherRequest({
  userId,
  cvFilePath,
  degreeFilePath,
  experienceText,
  actionToken,
  tokenExpiresAt,
}) {
  const [result] = await pool.query(
    `INSERT INTO teacher_requests
      (user_id, cv_file_path, degree_file_path, experience_text, action_token, token_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, cvFilePath, degreeFilePath, experienceText, actionToken, tokenExpiresAt],
  );
  return result.insertId;
}

export async function listTeacherRequests(status = null) {
  const meta = await getTeacherRequestMeta();
  const [rows] = await pool.query(
    `SELECT tr.*, u.email, u.${meta.userNameCol} AS full_name
      FROM teacher_requests tr
      INNER JOIN users u ON u.id = tr.user_id
      ${status ? "WHERE tr.status = ?" : ""}
      ORDER BY tr.created_at DESC`,
    status ? [status] : [],
  );
  return rows;
}

export async function findTeacherRequestByActionToken(actionToken) {
  const [rows] = await pool.query(
    "SELECT * FROM teacher_requests WHERE action_token = ? LIMIT 1",
    [actionToken],
  );
  return rows[0] || null;
}

export async function decideTeacherRequest({
  requestId,
  status,
  adminNote,
  decidedBy,
}) {
  await pool.query(
    `UPDATE teacher_requests
      SET status = ?, admin_note = ?, decided_by = ?, decided_at = NOW()
      WHERE id = ?`,
    [status, adminNote || null, decidedBy || null, requestId],
  );
}

export async function assignSupervisorRole(userId) {
  const [roleRows] = await pool.query(
    "SELECT id FROM roles WHERE name = 'supervisor' LIMIT 1",
  );
  if (!roleRows[0]) throw new Error("Role supervisor not found");
  await pool.query("UPDATE users SET role_id = ? WHERE id = ?", [
    roleRows[0].id,
    userId,
  ]);
}
