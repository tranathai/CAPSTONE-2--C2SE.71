import pool from "../config/db.js";

let notificationMetaPromise;

async function getNotificationMeta() {
  if (!notificationMetaPromise) {
    notificationMetaPromise = pool
      .query("SHOW COLUMNS FROM notifications")
      .then(([rows]) => {
        const cols = new Set(rows.map((row) => row.Field));
        return {
          kindCol: cols.has("kind") ? "kind" : cols.has("type") ? "type" : null,
          messageCol: cols.has("message")
            ? "message"
            : cols.has("content")
              ? "content"
              : null,
          hasReadAt: cols.has("read_at"),
          hasEntityType: cols.has("entity_type"),
          hasEntityId: cols.has("entity_id"),
        };
      })
      .catch((error) => {
        notificationMetaPromise = null;
        throw error;
      });
  }
  return notificationMetaPromise;
}

export async function createNotification({
  recipientUserId,
  kind,
  message,
  entityType,
  entityId,
}) {
  const meta = await getNotificationMeta();
  if (!meta.kindCol || !meta.messageCol) return null;
  const [result] = await pool.query(
    `INSERT INTO notifications (recipient_user_id, ${meta.kindCol}, ${meta.messageCol}${meta.hasEntityType ? ", entity_type" : ""}${meta.hasEntityId ? ", entity_id" : ""})
      VALUES (?, ?, ?${meta.hasEntityType ? ", ?" : ""}${meta.hasEntityId ? ", ?" : ""})`,
    [
      recipientUserId,
      kind,
      message,
      ...(meta.hasEntityType ? [entityType || null] : []),
      ...(meta.hasEntityId ? [entityId || null] : []),
    ],
  );
  return result.insertId;
}

export async function listNotifications(recipientUserId, unreadOnly = false) {
  const meta = await getNotificationMeta();
  if (!meta.kindCol || !meta.messageCol) return [];
  const [rows] = await pool.query(
    `SELECT id,
      ${meta.kindCol} AS kind,
      ${meta.messageCol} AS message,
      ${meta.hasEntityType ? "entity_type" : "NULL"} AS entity_type,
      ${meta.hasEntityId ? "entity_id" : "NULL"} AS entity_id,
      is_read, created_at, ${meta.hasReadAt ? "read_at" : "NULL"} AS read_at
      FROM notifications
      WHERE recipient_user_id = ? ${unreadOnly ? "AND is_read = 0" : ""}
      ORDER BY created_at DESC
      LIMIT 100`,
    [recipientUserId],
  );
  return rows;
}

export async function markNotificationAsRead(notificationId, recipientUserId) {
  const meta = await getNotificationMeta();
  await pool.query(
    `UPDATE notifications SET is_read = 1${meta.hasReadAt ? ", read_at = NOW()" : ""} WHERE id = ? AND recipient_user_id = ?`,
    [notificationId, recipientUserId],
  );
}
