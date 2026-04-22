import pool from "../config/db.js";

export async function listUsers(req, res, next) {
  try {
    const keyword = req.query.q ? `%${req.query.q}%` : null;
    const role = req.query.role || null;
    let sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.status, r.name AS role, u.created_at
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
    `;
    const clauses = [];
    const params = [];
    if (keyword) {
      clauses.push("(u.full_name LIKE ? OR u.email LIKE ?)");
      params.push(keyword, keyword);
    }
    if (role) {
      clauses.push("r.name = ?");
      params.push(role);
    }
    if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
    sql += " ORDER BY u.created_at DESC";
    const [rows] = await pool.query(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function setUserStatus(req, res, next) {
  try {
    await pool.query("UPDATE users SET status = ? WHERE id = ?", [req.body.status, Number(req.params.id)]);
    return res.status(200).json({ success: true, message: "Cap nhat trang thai nguoi dung thanh cong" });
  } catch (error) {
    return next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, actor_user_id, action, entity_type, entity_id, meta_json, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 300`,
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}
