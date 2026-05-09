import pool from "../config/db.js";

export async function findByUserId(userId, { unreadOnly, limit = 50 } = {}) {
  let sql = `SELECT id, title, message, type, is_read, related_url, created_at
             FROM notifications WHERE user_id = ?`;
  const params = [userId];
  if (unreadOnly) sql += ` AND is_read = 0`;
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function createNotification({ userId, title, message, type, relatedUrl }) {
  const [result] = await pool.query(
    `INSERT INTO notifications (user_id, title, message, type, related_url) VALUES (?, ?, ?, ?, ?)`,
    [userId, title, message, type || "info", relatedUrl || null],
  );
  const notifId = result.insertId;

  // Real-time: emit notification to the user's personal room
  try {
    const { io } = await import("../server.js");
    io.to(`user:${userId}`).emit("new_notification", {
      id: notifId,
      title,
      message,
      type: type || "info",
      relatedUrl,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Socket not available yet (e.g., during bootstrap)
  }

  return notifId;
}

export async function markAsRead(id, userId) {
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
}

export async function markAllRead(userId) {
  await pool.query(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
}

export async function countUnread(userId) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId],
  );
  return rows[0]?.count ?? 0;
}

export async function findDeadlineReminders() {
  const [rows] = await pool.query(
    `SELECT m.id, m.name, m.end_date, m.deadline_type,
            s.team_id, s.title, t.name AS team_name
     FROM milestones m
     INNER JOIN submissions s ON s.milestone_id = m.id
     INNER JOIN teams t ON t.id = s.team_id
     WHERE m.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 DAY)
     AND NOT EXISTS (
       SELECT 1 FROM notifications n
       WHERE n.user_id IN (SELECT user_id FROM team_members WHERE team_id = s.team_id)
       AND n.type = 'deadline' AND n.related_url = CONCAT('/student/submissions/', s.id)
       AND n.created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
     )`,
  );
  return rows;
}
