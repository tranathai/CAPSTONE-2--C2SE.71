import pool from "../config/db.js";

export async function canAccessTeamChat(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM teams t
     WHERE t.id = ?
       AND (
         EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = ?)
         OR t.supervisor_user_id = ?
       )
     LIMIT 1`,
    [teamId, userId, userId],
  );
  return rows.length > 0;
}

export async function findUserChatGroups(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.name,
            (SELECT MAX(m.created_at) FROM messages m WHERE m.team_id = t.id) AS last_message_at,
            (SELECT m2.content
             FROM messages m2
             WHERE m2.team_id = t.id
             ORDER BY m2.created_at DESC
             LIMIT 1) AS last_message,
            (SELECT COUNT(*)
             FROM messages m3
             WHERE m3.team_id = t.id AND m3.receiver_id = ? AND m3.is_read = 0) AS unread_count
     FROM teams t
     WHERE EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = ?)
        OR t.supervisor_user_id = ?
     ORDER BY t.name ASC`,
    [userId, userId, userId],
  );
  return rows;
}

export async function findGroupMessages(teamId, { limit = 100, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT m.id, m.content, m.is_read, m.created_at, m.updated_at,
            m.is_deleted, m.message_kind, m.team_id,
            s.full_name AS sender_name, m.sender_id
     FROM messages m
     INNER JOIN users s ON s.id = m.sender_id
     WHERE m.team_id = ?
     ORDER BY m.created_at ASC
     LIMIT ? OFFSET ?`,
    [teamId, limit, offset],
  );
  return rows;
}

export async function findGroupMessageById(messageId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.content, m.sender_id, m.team_id, m.message_kind, m.is_deleted, m.created_at,
            u.full_name AS sender_name
     FROM messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.id = ? AND m.team_id IS NOT NULL
     LIMIT 1`,
    [messageId],
  );
  return rows[0] || null;
}

export async function updateGroupChatMessage(messageId, senderId, content) {
  const [result] = await pool.query(
    `UPDATE messages
     SET content = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND sender_id = ? AND team_id IS NOT NULL
       AND message_kind = 'chat' AND is_deleted = 0
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [content, messageId, senderId],
  );
  return result.affectedRows > 0;
}

export async function softDeleteGroupChatMessage(messageId, senderId) {
  const [result] = await pool.query(
    `UPDATE messages
     SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND sender_id = ? AND team_id IS NOT NULL
       AND message_kind = 'chat' AND is_deleted = 0
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [messageId, senderId],
  );
  return result.affectedRows > 0;
}

export async function insertGroupSystemNotice({ teamId, actorId, content }) {
  const [result] = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content, team_id, message_kind)
     VALUES (?, ?, ?, ?, 'system')`,
    [actorId, actorId, content, teamId],
  );
  return result.insertId;
}

export async function getGroupChatMemberIds(teamId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT u.id
     FROM users u
     WHERE EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = ? AND tm.user_id = u.id)
        OR EXISTS (SELECT 1 FROM teams t WHERE t.id = ? AND t.supervisor_user_id = u.id)`,
    [teamId, teamId],
  );
  return rows.map((r) => r.id);
}

export async function sendGroupMessage({ senderId, teamId, content }) {
  const [memberRows] = await pool.query(
    `SELECT DISTINCT u.id
     FROM users u
     WHERE (
       EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = ? AND tm.user_id = u.id)
       OR EXISTS (SELECT 1 FROM teams t WHERE t.id = ? AND t.supervisor_user_id = u.id)
     )
       AND u.id <> ?`,
    [teamId, teamId, senderId],
  );

  // Group chat: only persist one row per message.
  const [result] = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content, team_id) VALUES (?, ?, ?, ?)`,
    [senderId, senderId, content, teamId],
  );
  return { insertedId: result.insertId, receivers: memberRows.map((r) => r.id) };
}

export async function markGroupMessagesRead(teamId, userId) {
  await pool.query(
    `UPDATE messages SET is_read = 1
     WHERE team_id = ? AND receiver_id = ? AND is_read = 0`,
    [teamId, userId],
  );
}

export async function canUsersMessageEachOther(userId1, userId2) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM teams t
     WHERE (
       EXISTS (SELECT 1 FROM team_members tm1 WHERE tm1.team_id = t.id AND tm1.user_id = ?)
       AND EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = t.id AND tm2.user_id = ?)
     )
     OR (
       EXISTS (SELECT 1 FROM team_members tm1 WHERE tm1.team_id = t.id AND tm1.user_id = ?)
       AND t.supervisor_user_id = ?
     )
     OR (
       EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = t.id AND tm2.user_id = ?)
       AND t.supervisor_user_id = ?
     )
     LIMIT 1`,
    [userId1, userId2, userId1, userId2, userId2, userId1],
  );
  return rows.length > 0;
}

export async function findConversation(userId1, userId2, { limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT m.id, m.content, m.is_read, m.created_at, m.topic_id,
            s.full_name AS sender_name, s.id AS sender_id,
            r.full_name AS receiver_name, r.id AS receiver_id
     FROM messages m
     INNER JOIN users s ON s.id = m.sender_id
     INNER JOIN users r ON r.id = m.receiver_id
     WHERE ((m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?))
       AND m.topic_id IS NULL
     ORDER BY m.created_at ASC
     LIMIT ? OFFSET ?`,
    [userId1, userId2, userId2, userId1, limit, offset],
  );
  return rows;
}

export async function findContactList(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.avatar_url, r.name AS role_name,
            (SELECT MAX(m2.created_at) FROM messages m2
             WHERE (m2.sender_id = ? AND m2.receiver_id = u.id)
                OR (m2.sender_id = u.id AND m2.receiver_id = ?)) AS last_message_at,
            (SELECT m2.content FROM messages m2
             WHERE (m2.sender_id = ? AND m2.receiver_id = u.id)
                OR (m2.sender_id = u.id AND m2.receiver_id = ?)
             ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
            (SELECT COUNT(*) FROM messages m3
             WHERE m3.sender_id = u.id AND m3.receiver_id = ? AND m3.is_read = 0) AS unread_count
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id != ?
       AND (
         EXISTS (
           SELECT 1
           FROM teams t
           WHERE (
             EXISTS (SELECT 1 FROM team_members tm1 WHERE tm1.team_id = t.id AND tm1.user_id = ?)
             AND EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = t.id AND tm2.user_id = u.id)
           )
           OR (
             EXISTS (SELECT 1 FROM team_members tm1 WHERE tm1.team_id = t.id AND tm1.user_id = ?)
             AND t.supervisor_user_id = u.id
           )
           OR (
             EXISTS (SELECT 1 FROM team_members tm2 WHERE tm2.team_id = t.id AND tm2.user_id = u.id)
             AND t.supervisor_user_id = ?
           )
         )
       )
     ORDER BY (last_message_at IS NULL), last_message_at DESC, u.full_name ASC`,
    [userId, userId, userId, userId, userId, userId, userId, userId, userId],
  );
  return rows;
}

export async function sendMessage({ senderId, receiverId, content, topicId = null }) {
  const [result] = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content, topic_id) VALUES (?, ?, ?, ?)`,
    [senderId, receiverId, content, topicId],
  );
  return result.insertId;
}

export async function markMessagesRead(senderId, receiverId) {
  await pool.query(
    `UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0`,
    [senderId, receiverId],
  );
}

export async function countUnreadMessages(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0`,
    [userId],
  );
  return rows[0]?.count ?? 0;
}

export async function findTopicMessages(topicId, { limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT m.id, m.content, m.is_read, m.created_at,
            s.full_name AS sender_name, s.id AS sender_id, s.avatar_url AS sender_avatar,
            r.full_name AS receiver_name, r.id AS receiver_id,
            t.title AS topic_title
     FROM messages m
     INNER JOIN users s ON s.id = m.sender_id
     INNER JOIN users r ON r.id = m.receiver_id
     INNER JOIN topics t ON t.id = m.topic_id
     WHERE m.topic_id = ?
     ORDER BY m.created_at ASC
     LIMIT ? OFFSET ?`,
    [topicId, limit, offset],
  );
  return rows;
}

export async function findUserTopicsWithMessages(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT t.id, t.title, t.description,
            (SELECT COUNT(*) FROM messages m WHERE m.topic_id = t.id) AS message_count,
            (SELECT COUNT(*) FROM messages m WHERE m.topic_id = t.id AND m.receiver_id = ? AND m.is_read = 0) AS unread_count,
            (SELECT MAX(m.created_at) FROM messages m WHERE m.topic_id = t.id) AS last_message_at
     FROM topics t
     INNER JOIN teams tm ON tm.id = t.team_id
     INNER JOIN team_members tmb ON tmb.team_id = tm.id
     WHERE tmb.user_id = ? AND EXISTS (SELECT 1 FROM messages m WHERE m.topic_id = t.id)
     ORDER BY last_message_at DESC`,
    [userId, userId],
  );
  return rows;
}
