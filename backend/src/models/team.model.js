import pool from "../config/db.js";

export async function findTeamById(id) {
  const [rows] = await pool.query(
    `SELECT t.*, u.full_name AS leader_name
     FROM teams t
     LEFT JOIN users u ON u.id = t.leader_user_id
     WHERE t.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findTeamByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.name, t.semester, t.leader_user_id, u.full_name AS leader_name
     FROM teams t
     INNER JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = t.leader_user_id
     WHERE tm.user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
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
  let sql = `SELECT t.id, t.name, t.semester, t.description, t.leader_user_id,
                    u.full_name AS leader_name,
                    (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
             FROM teams t
             LEFT JOIN users u ON u.id = t.leader_user_id
             WHERE 1=1`;
  const params = [];
  if (search) { sql += ` AND t.name LIKE ?`; params.push(`%${search}%`); }
  sql += ` ORDER BY t.id DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function createTeam({ name, description, semester, leaderUserId }) {
  const [result] = await pool.query(
    `INSERT INTO teams (name, description, semester, leader_user_id) VALUES (?, ?, ?, ?)`,
    [name, description || null, semester || null, leaderUserId || null],
  );
  return result.insertId;
}

export async function updateTeam(id, { name, description, semester, leaderUserId }) {
  await pool.query(
    `UPDATE teams SET name = COALESCE(?, name), description = COALESCE(?, description),
                      semester = COALESCE(?, semester), leader_user_id = COALESCE(?, leader_user_id)
     WHERE id = ?`,
    [name, description, semester, leaderUserId, id],
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
    `SELECT DISTINCT t.id, t.name, t.semester, t.description, t.leader_user_id,
            u.full_name AS leader_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM teams t
     INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved'
     LEFT JOIN users u ON u.id = t.leader_user_id
     WHERE tr.supervisor_id = ?
     ORDER BY t.id DESC`,
    [supervisorId],
  );
  return rows;
}
