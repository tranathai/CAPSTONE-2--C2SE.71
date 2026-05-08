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

      tp.title AS project_title,

      ROUND(
        COUNT(DISTINCT s.milestone_id) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM milestones), 0)
      ) AS progress

    FROM team_members my_tm

    JOIN teams t
      ON t.id = my_tm.team_id

    JOIN team_members tm
      ON tm.team_id = t.id

    JOIN users u
      ON u.id = tm.user_id

    LEFT JOIN topics tp
      ON tp.team_id = t.id

    LEFT JOIN submissions s
      ON s.team_id = t.id

    WHERE my_tm.user_id = ?
  `;

  const params = [currentUserId];

  if (studentName) {
    sql += ` AND u.name LIKE ?`;
    params.push(`%${studentName}%`);
  }

  if (teamName) {
    sql += ` AND t.name LIKE ?`;
    params.push(`%${teamName}%`);
  }

  sql += `
    GROUP BY
      u.id,
      u.name,
      u.email,
      t.id,
      t.name,
      tp.title

    ORDER BY t.id ASC
  `;

  const [rows] = await pool.query(sql, params);

  return rows;
}
export async function getTeamManagementForMentor({
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

      tp.title AS project_title,

      ROUND(
        COUNT(DISTINCT s.milestone_id) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM milestones), 0)
      ) AS progress

    FROM teams t

    JOIN team_members tm
      ON tm.team_id = t.id

    JOIN users u
      ON u.id = tm.user_id

    LEFT JOIN topics tp
      ON tp.team_id = t.id

    LEFT JOIN submissions s
      ON s.team_id = t.id

    WHERE t.supervisor_id = ?
  `;

  const params = [currentUserId];

  if (studentName) {
    sql += ` AND u.name LIKE ?`;
    params.push(`%${studentName}%`);
  }

  if (teamName) {
    sql += ` AND t.name LIKE ?`;
    params.push(`%${teamName}%`);
  }

  sql += `
    GROUP BY
      u.id,
      u.name,
      u.email,
      t.id,
      t.name,
      tp.title

    ORDER BY t.id ASC
  `;

  const [rows] = await pool.query(sql, params);

  return rows;
}
