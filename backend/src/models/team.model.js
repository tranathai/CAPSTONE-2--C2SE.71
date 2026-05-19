import pool from "../config/db.js";

export async function findTeamById(id) {
  const [rows] = await pool.query(
    `SELECT t.*, u.full_name AS leader_name, su.full_name AS supervisor_name, su.email AS supervisor_email
     FROM teams t
     LEFT JOIN users u ON u.id = t.leader_user_id
     LEFT JOIN users su ON su.id = t.supervisor_user_id
     WHERE t.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findTeamByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.semester, t.leader_user_id, t.supervisor_user_id, u.full_name AS leader_name, su.full_name AS supervisor_name, su.email AS supervisor_email
     FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = t.leader_user_id
     LEFT JOIN users su ON su.id = t.supervisor_user_id
     WHERE tm.user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

export async function findTeamsByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.semester, t.leader_user_id, t.supervisor_user_id, u.full_name AS leader_name, su.full_name AS supervisor_name, su.email AS supervisor_email
     FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = t.leader_user_id
     LEFT JOIN users su ON su.id = t.supervisor_user_id
     WHERE tm.user_id = ?
     ORDER BY t.name ASC`,
    [userId],
  );
  return rows;
}

export async function userBelongsToTeam(userId, teamId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM team_members WHERE user_id = ? AND team_id = ? LIMIT 1`,
    [userId, teamId],
  );
  return rows.length > 0;
}

export async function findUserRoleNameById(userId) {
  const [rows] = await pool.query(
    `SELECT r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0]?.role_name || null;
}

export async function countStudentMembersInTeam(teamId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE tm.team_id = ? AND r.name = 'student'`,
    [teamId],
  );
  return Number(rows[0]?.count || 0);
}

/** Sinh viên đã ở nhóm khác cùng chuỗi semester (học kỳ + năm học). */
export async function findStudentOtherTeamInSemester(userId, semester, excludeTeamId = null) {
  const sem = String(semester || "").trim();
  if (!sem || !userId) return null;
  let sql = `SELECT t.id, t.name, t.semester
     FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id
     INNER JOIN users u ON u.id = tm.user_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE tm.user_id = ? AND r.name = 'student' AND TRIM(COALESCE(t.semester, '')) = ?`;
  const params = [userId, sem];
  if (excludeTeamId) {
    sql += ` AND t.id <> ?`;
    params.push(excludeTeamId);
  }
  sql += ` LIMIT 1`;
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

export async function findStudentUserIdsInSemester(semester, excludeTeamId = null) {
  const sem = String(semester || "").trim();
  if (!sem) return [];
  let sql = `SELECT DISTINCT tm.user_id
     FROM team_members tm
     INNER JOIN teams t ON t.id = tm.team_id
     INNER JOIN users u ON u.id = tm.user_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'student' AND TRIM(COALESCE(t.semester, '')) = ?`;
  const params = [sem];
  if (excludeTeamId) {
    sql += ` AND t.id <> ?`;
    params.push(excludeTeamId);
  }
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => Number(r.user_id)).filter((id) => id > 0);
}

export async function findTeamMembers(teamId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, tm.is_leader,
            sp.student_code
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE tm.team_id = ?
     ORDER BY tm.is_leader DESC, u.full_name ASC`,
    [teamId],
  );
  return rows;
}

export async function findAllTeams({ search } = {}) {
  let sql = `SELECT t.id, t.name, t.semester, t.description, t.created_at, t.updated_at, t.leader_user_id, t.supervisor_user_id,
                    u.full_name AS leader_name,
                    su.full_name AS supervisor_name, su.email AS supervisor_email,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count,
                    (SELECT MIN(tm2.joined_at) FROM team_members tm2 WHERE tm2.team_id = t.id) AS members_joined_earliest,
                    COALESCE(
                      t.created_at,
                      t.updated_at,
                      (SELECT MIN(tm3.joined_at) FROM team_members tm3 WHERE tm3.team_id = t.id)
                    ) AS chart_timestamp
             FROM teams t
             LEFT JOIN users u ON u.id = t.leader_user_id
             LEFT JOIN users su ON su.id = t.supervisor_user_id
             WHERE 1=1`;
  const params = [];
  if (search) { sql += ` AND t.name LIKE ?`; params.push(`%${search}%`); }
  sql += ` ORDER BY t.id DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Trùng tên: so sánh không phân biệt hoa thường, bỏ khoảng đầu/cuối. excludeTeamId: bỏ qua khi đổi tên nhóm. */
export async function findTeamIdByNormalizedName(trimmedName, { excludeTeamId } = {}) {
  const key = String(trimmedName || "").trim();
  if (!key) return null;
  let sql = `SELECT id FROM teams WHERE LOWER(TRIM(name)) = LOWER(?)`;
  const params = [key];
  if (excludeTeamId) {
    sql += ` AND id <> ?`;
    params.push(excludeTeamId);
  }
  sql += ` LIMIT 1`;
  const [rows] = await pool.query(sql, params);
  return rows[0]?.id ?? null;
}

export async function createTeam({ name, description, semester, leaderUserId, supervisorUserId }) {
  const [result] = await pool.query(
    `INSERT INTO teams (name, description, semester, leader_user_id, supervisor_user_id) VALUES (?, ?, ?, ?, ?)`,
    [name, description || null, semester || null, leaderUserId || null, supervisorUserId || null],
  );
  return result.insertId;
}

export async function updateTeam(id, { name, description, semester, leaderUserId, supervisorUserId }) {
  await pool.query(
    `UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description),
                      semester = COALESCE(?, semester), leader_user_id = COALESCE(?, leader_user_id),
                      supervisor_user_id = COALESCE(?, supervisor_user_id)
     WHERE id = ?`,
    [name, description, semester, leaderUserId, supervisorUserId, id],
  );
}

export async function deleteTeam(id) {
  await pool.query(`DELETE FROM teams WHERE id = ?`, [id]);
}

export async function addTeamMember(teamId, userId, isLeader = false) {
  await pool.query(
    `INSERT IGNORE INTO team_members (team_id, user_id, is_leader) VALUES (?, ?, ?)`,
    [teamId, userId, isLeader ? 1 : 0],
  );
}

export async function removeTeamMember(teamId, userId) {
  await pool.query(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`, [teamId, userId]);
}

export async function setTeamLeader(teamId, leaderUserId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`UPDATE team_members SET is_leader = 0 WHERE team_id = ?`, [teamId]);
    await conn.query(
      `UPDATE team_members SET is_leader = 1 WHERE team_id = ? AND user_id = ?`,
      [teamId, leaderUserId],
    );
    await conn.query(`UPDATE teams SET leader_user_id = ? WHERE id = ?`, [leaderUserId, teamId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function findTeamsBySupervisorId(supervisorId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT t.id, t.name, t.semester, t.description, t.leader_user_id, t.supervisor_user_id,
            u.full_name AS leader_name,
            su.full_name AS supervisor_name, su.email AS supervisor_email,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t
     LEFT JOIN users u ON u.id = t.leader_user_id
     LEFT JOIN users su ON su.id = t.supervisor_user_id
     WHERE t.supervisor_user_id = ?
     ORDER BY t.id DESC`,
    [supervisorId],
  );
  return rows;
}
