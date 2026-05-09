import pool from "../config/db.js";

export async function findMeetingById(id) {
  const [rows] = await pool.query(
    `SELECT m.*, u.full_name AS host_name, t.name AS team_name,
            (SELECT GROUP_CONCAT(u2.full_name SEPARATOR ', ')
             FROM meeting_participants mp INNER JOIN users u2 ON u2.id = mp.user_id
             WHERE mp.meeting_id = m.id) AS participant_names
     FROM meetings m
     INNER JOIN users u ON u.id = m.host_id
     LEFT JOIN teams t ON t.id = m.team_id
     WHERE m.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findMeetingsByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT m.id, m.title, m.description, m.scheduled_at, m.duration_minutes,
            m.location, m.status, m.meeting_url,
            u.full_name AS host_name, t.name AS team_name
     FROM meetings m
     INNER JOIN users u ON u.id = m.host_id
     LEFT JOIN teams t ON t.id = m.team_id
     LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
     WHERE m.host_id = ? OR mp.user_id = ?
     ORDER BY m.scheduled_at DESC`,
    [userId, userId],
  );
  return rows;
}

export async function findUpcomingMeetings(userId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT DISTINCT m.id, m.title, m.scheduled_at, m.duration_minutes, m.location,
            u.full_name AS host_name, t.name AS team_name
     FROM meetings m
     INNER JOIN users u ON u.id = m.host_id
     LEFT JOIN teams t ON t.id = m.team_id
     LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
     WHERE (m.host_id = ? OR mp.user_id = ?)
       AND m.scheduled_at > NOW()
       AND m.status = 'scheduled'
     ORDER BY m.scheduled_at ASC LIMIT ?`,
    [userId, userId, limit],
  );
  return rows;
}

export async function createMeeting({ title, description, scheduledAt, durationMinutes, teamId, hostId, meetingUrl, location }) {
  const [result] = await pool.query(
    `INSERT INTO meetings (title, description, scheduled_at, duration_minutes, team_id, host_id, meeting_url, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, scheduledAt, durationMinutes || 60, teamId || null, hostId, meetingUrl || null, location || null],
  );
  return result.insertId;
}

export async function updateMeeting(id, { title, description, scheduledAt, durationMinutes, meetingUrl, location, status }) {
  await pool.query(
    `UPDATE meetings SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       scheduled_at = COALESCE(?, scheduled_at),
       duration_minutes = COALESCE(?, duration_minutes),
       meeting_url = COALESCE(?, meeting_url),
       location = COALESCE(?, location),
       status = COALESCE(?, status)
     WHERE id = ?`,
    [title, description, scheduledAt, durationMinutes, meetingUrl, location, status, id],
  );
}

export async function deleteMeeting(id) {
  await pool.query(`DELETE FROM meetings WHERE id = ?`, [id]);
}

export async function addMeetingParticipant(meetingId, userId) {
  await pool.query(
    `INSERT IGNORE INTO meeting_participants (meeting_id, user_id) VALUES (?, ?)`,
    [meetingId, userId],
  );
}

// Meeting requests
export async function findRequestById(id) {
  const [rows] = await pool.query(
    `SELECT mr.*, t.name AS team_name, u.full_name AS requester_name, s.full_name AS supervisor_name
     FROM meeting_requests mr
     INNER JOIN teams t ON t.id = mr.team_id
     INNER JOIN users u ON u.id = mr.requester_id
     INNER JOIN users s ON s.id = mr.supervisor_id
     WHERE mr.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function findRequestsBySupervisorId(supervisorId) {
  const [rows] = await pool.query(
    `SELECT mr.id, mr.title, mr.reason, mr.proposed_at, mr.status, mr.response_reason, mr.created_at,
            t.id AS team_id, t.name AS team_name,
            u.full_name AS requester_name
     FROM meeting_requests mr
     INNER JOIN teams t ON t.id = mr.team_id
     INNER JOIN users u ON u.id = mr.requester_id
     WHERE mr.supervisor_id = ?
     ORDER BY mr.status ASC, mr.created_at DESC`,
    [supervisorId],
  );
  return rows;
}

export async function createMeetingRequest({ teamId, requesterId, supervisorId, title, reason, proposedAt }) {
  const [result] = await pool.query(
    `INSERT INTO meeting_requests (team_id, requester_id, supervisor_id, title, reason, proposed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [teamId, requesterId, supervisorId, title, reason || null, proposedAt],
  );
  return result.insertId;
}

export async function updateMeetingRequest(id, { status, responseReason }) {
  await pool.query(
    `UPDATE meeting_requests SET status = ?, response_reason = ?, response_at = NOW() WHERE id = ?`,
    [status, responseReason || null, id],
  );
}

export async function findRequestsByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT mr.*, u.full_name AS supervisor_name
     FROM meeting_requests mr
     INNER JOIN users u ON u.id = mr.supervisor_id
     WHERE mr.team_id = ?
     ORDER BY mr.created_at DESC`,
    [teamId],
  );
  return rows;
}
