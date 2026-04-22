import pool from "../config/db.js";

export function auditTrail(req, res, next) {
  const startedAt = Date.now();
  const originalEnd = res.end;
  res.end = function patchedEnd(...args) {
    const durationMs = Date.now() - startedAt;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const actorUserId = req.user?.id || null;
      pool
        .query(
          `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, meta_json)
            VALUES (?, ?, ?, ?, ?)`,
          [
            actorUserId,
            `${req.method} ${req.originalUrl}`,
            "http_request",
            null,
            JSON.stringify({ durationMs, statusCode: res.statusCode }),
          ],
        )
        .catch(() => {});
    }
    return originalEnd.apply(this, args);
  };
  return next();
}
