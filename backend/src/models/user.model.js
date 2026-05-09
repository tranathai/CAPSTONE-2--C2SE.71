import pool from "../config/db.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, u.phone, u.avatar_url, r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email],
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, u.phone, u.avatar_url, r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function updateUserProfile(id, { fullName, phone, avatarUrl }) {
  await pool.query(
    `UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?`,
    [fullName, phone, avatarUrl, id],
  );
}

export async function getStudentProfile(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.is_active,
            sp.student_code, sp.class_name, sp.major, sp.enrollment_year,
            r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.id = ? AND r.name = 'student'`,
    [userId],
  );
  return rows[0] || null;
}

export async function getSupervisorProfile(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.is_active,
            svp.lecturer_code, svp.department, svp.specialization, svp.academic_title,
            r.name AS role_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     LEFT JOIN supervisor_profiles svp ON svp.user_id = u.id
     WHERE u.id = ? AND r.name = 'supervisor'`,
    [userId],
  );
  return rows[0] || null;
}

export async function listUsers({ role, status, search } = {}) {
  let sql = `SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.created_at, r.name AS role_name
             FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE 1=1`;
  const params = [];
  if (role) { sql += ` AND r.name = ?`; params.push(role); }
  if (status === "active") { sql += ` AND u.is_active = 1`; }
  else if (status === "inactive") { sql += ` AND u.is_active = 0`; }
  if (search) { sql += ` AND (u.email LIKE ? OR u.full_name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  sql += ` ORDER BY u.id DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function createUser({ email, passwordHash, fullName, roleId, phone }) {
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role_id, phone) VALUES (?, ?, ?, ?, ?)`,
    [email, passwordHash, fullName, roleId, phone || null],
  );
  return result.insertId;
}

export async function updateUserRole(userId, roleId) {
  await pool.query(`UPDATE users SET role_id = ? WHERE id = ?`, [roleId, userId]);
}

export async function toggleUserActive(userId, isActive) {
  await pool.query(`UPDATE users SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, userId]);
}

export async function findUserWithStudentCode(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.role_id, u.is_active, r.name AS role_name,
            sp.student_code
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     WHERE u.email = ?`,
    [email],
  );
  return rows[0] || null;
}
