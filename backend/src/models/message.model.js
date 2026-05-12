import pool from "../config/db.js";

export async function findConversation(userId1, userId2, topicId = null, { limit = 50, offset = 0 } = {}) {
  let sql = `SELECT m.id, m.content, m.is_read, m.created_at, m.topic_id,
            s.full_name AS sender_name, s.id AS sender_id,
            r.full_name AS receiver_name, r.id AS receiver_id,
            t.title AS topic_title
     FROM messages m
     INNER JOIN users s ON s.id = m.sender_id
     INNER JOIN users r ON r.id = m.receiver_id
     LEFT JOIN topics t ON t.id = m.topic_id
     WHERE ((m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?))`;
  
  const params = [userId1, userId2, userId2, userId1];
  
  if (topicId) {
    sql += ` AND m.topic_id = ?`;
    params.push(topicId);
  } else {
    sql += ` AND m.topic_id IS NULL`; // Messages chung không thuộc topic nào
  }
  
  sql += ` ORDER BY m.created_at ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.query(sql, params);
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
       AND EXISTS (
         SELECT 1 FROM messages m4
         WHERE (m4.sender_id = ? AND m4.receiver_id = u.id)
            OR (m4.sender_id = u.id AND m4.receiver_id = ?)
       )
     ORDER BY last_message_at DESC`,
    [userId, userId, userId, userId, userId, userId, userId, userId],
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
