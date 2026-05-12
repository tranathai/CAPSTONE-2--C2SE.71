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
  let sql = `SELECT t.id, t.name, t.semester, t.description, t.leader_user_id, t.supervisor_user_id,
                    u.full_name AS leader_name,
                    su.full_name AS supervisor_name, su.email AS supervisor_email,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
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
