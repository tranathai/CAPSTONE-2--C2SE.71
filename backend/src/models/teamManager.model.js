import pool from "../config/db.js";

/* ================= STUDENT ================= */
export async function getTeamManagementData({
  studentName,
  teamName,
  currentUserId,
}) {
  let sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      t.id AS team_id,
      t.name AS team_name,

      MAX(tp.title) AS project_title,
      MAX(s.id) AS submission_id,

      ROUND(
        COUNT(DISTINCT s.milestone_id) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM milestones), 0)
      ) AS progress

    FROM users u
    JOIN team_members tm ON tm.user_id = u.id
    JOIN teams t ON t.id = tm.team_id
    LEFT JOIN submissions s ON s.team_id = t.id
    LEFT JOIN topics tp ON tp.team_id = t.id

    WHERE t.id IN (
      SELECT team_id FROM team_members WHERE user_id = ?
    )
  `;

  const params = [currentUserId];

  if (studentName) {
    sql += " AND u.name LIKE ?";
    params.push(`%${studentName}%`);
  }

  if (teamName) {
    sql += " AND t.name LIKE ?";
    params.push(`%${teamName}%`);
  }

  sql += `
    GROUP BY u.id, u.name, u.email, t.id, t.name
    ORDER BY t.id ASC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

/* ================= MENTOR ================= */
export async function getTeamManagementForMentor({
  studentName,
  teamName,
}) {
  let sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      t.id AS team_id,
      t.name AS team_name,

      MAX(tp.title) AS project_title,
      MAX(s.id) AS submission_id,

      ROUND(
        COUNT(DISTINCT s.milestone_id) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM milestones), 0)
      ) AS progress

    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    JOIN users u ON u.id = tm.user_id
    LEFT JOIN submissions s ON s.team_id = t.id
    LEFT JOIN topics tp ON tp.team_id = t.id
  `;

  const params = [];
  const conditions = [];

  if (studentName) {
    conditions.push("u.name LIKE ?");
    params.push(`%${studentName}%`);
  }

  if (teamName) {
    conditions.push("t.name LIKE ?");
    params.push(`%${teamName}%`);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += `
    GROUP BY u.id, u.name, u.email, t.id, t.name
    ORDER BY t.id ASC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}