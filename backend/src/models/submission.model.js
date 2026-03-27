import pool from "../config/db.js";

export async function findSubmissionReviewById(submissionId) {
  const sql = `
    SELECT
      sv.id AS submission_version_id,
      sv.file_path,
      sv.version_number,
      t.name AS team_name,
      u.full_name AS student_name
    FROM submissions s
    INNER JOIN teams t
      ON t.id = s.team_id
    INNER JOIN submission_versions sv
      ON sv.submission_id = s.id
    LEFT JOIN team_members tm
      ON tm.team_id = t.id AND tm.is_leader = 1
    LEFT JOIN users u
      ON u.id = tm.user_id
    WHERE s.id = ?
    ORDER BY sv.version_number DESC, sv.created_at DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [submissionId]);
  return rows[0] || null;
}
