import pool from "../config/db.js";

export async function findTopicByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.title, tr.description, tr.technologies, tr.status,
            tr.supervisor_id, tr.rejection_reason, tr.created_at, tr.updated_at,
            u.full_name AS supervisor_name,
            t.name AS team_name
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     LEFT JOIN users u ON u.id = tr.supervisor_id
     WHERE tr.team_id = ?`,
    [teamId],
  );
  return rows[0] || null;
}

export async function findPendingTopics() {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.title, tr.description, tr.technologies, tr.created_at,
            t.id AS team_id, t.name AS team_name,
            (SELECT u.full_name FROM team_members tm INNER JOIN users u ON u.id = tm.user_id
             WHERE tm.team_id = t.id AND tm.is_leader = 1 LIMIT 1) AS leader_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     WHERE tr.status = 'pending'
     ORDER BY tr.created_at ASC`,
  );
  return rows;
}

export async function createTopic({ teamId, title, description, technologies }) {
  const [result] = await pool.query(
    `INSERT INTO topic_registrations (team_id, title, description, technologies) VALUES (?, ?, ?, ?)`,
    [teamId, title, description || null, technologies || null],
  );
  return result.insertId;
}

export async function updateTopicStatus(id, { status, supervisorId, rejectionReason }) {
  await pool.query(
    `UPDATE topic_registrations SET status = ?, supervisor_id = ?, rejection_reason = ? WHERE id = ?`,
    [status, supervisorId || null, rejectionReason || null, id],
  );
}

export async function findApprovedTopicsBySupervisor(supervisorId) {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.title, tr.description, tr.technologies, tr.created_at,
            t.id AS team_id, t.name AS team_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     WHERE tr.supervisor_id = ? AND tr.status = 'approved'
     ORDER BY tr.id DESC`,
    [supervisorId],
  );
  return rows;
}

export async function hasActiveTopic(teamId) {
  const [rows] = await pool.query(
    `SELECT 1 FROM topic_registrations WHERE team_id = ? AND status IN ('pending', 'approved') LIMIT 1`,
    [teamId],
  );
  return rows.length > 0;
}
