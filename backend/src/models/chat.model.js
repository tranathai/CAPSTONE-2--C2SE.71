import pool from "../config/db.js";

export async function getOrCreateTeamConversation(teamId) {
  const [existing] = await pool.query(
    "SELECT id FROM conversations WHERE scope_type = 'team' AND scope_id = ? LIMIT 1",
    [teamId],
  );
  if (existing[0]) return existing[0].id;
  const [result] = await pool.query(
    "INSERT INTO conversations (scope_type, scope_id) VALUES ('team', ?)",
    [teamId],
  );
  return result.insertId;
}

export async function ensureParticipant(conversationId, userId) {
  await pool.query(
    `INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE joined_at = joined_at`,
    [conversationId, userId],
  );
}

export async function createMessage({ conversationId, senderUserId, body }) {
  const [result] = await pool.query(
    "INSERT INTO messages (conversation_id, sender_user_id, body) VALUES (?, ?, ?)",
    [conversationId, senderUserId, body],
  );
  return result.insertId;
}

export async function listMessages(conversationId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.conversation_id, m.sender_user_id, m.body, m.created_at, u.full_name AS sender_name
      FROM messages m
      INNER JOIN users u ON u.id = m.sender_user_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
      LIMIT 300`,
    [conversationId],
  );
  return rows;
}
