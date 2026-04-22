import pool from "../config/db.js";

let userMetaPromise;

async function getUserMeta() {
  if (!userMetaPromise) {
    userMetaPromise = pool
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          nameCol: names.has("full_name") ? "full_name" : names.has("name") ? "name" : null,
          passwordCol: names.has("password_hash")
            ? "password_hash"
            : names.has("password")
              ? "password"
              : null,
          hasPhone: names.has("phone"),
          hasStatus: names.has("status"),
        };
      })
      .catch((error) => {
        userMetaPromise = null;
        throw error;
      });
  }
  return userMetaPromise;
}

export async function findUserByEmail(email) {
  const meta = await getUserMeta();
  const sql = `
    SELECT u.id, u.${meta.nameCol} AS full_name, u.email, u.${meta.passwordCol} AS password_hash,
      ${meta.hasPhone ? "u.phone" : "''"} AS phone,
      ${meta.hasStatus ? "u.status" : "'active'"} AS status,
      r.name AS role
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.email = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [email]);
  return rows[0] || null;
}

export async function findUserById(userId) {
  const meta = await getUserMeta();
  const sql = `
    SELECT u.id, u.${meta.nameCol} AS full_name, u.email,
      ${meta.hasPhone ? "u.phone" : "''"} AS phone,
      ${meta.hasStatus ? "u.status" : "'active'"} AS status,
      r.name AS role
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows[0] || null;
}

export async function createUser({ fullName, email, passwordHash, role }) {
  const meta = await getUserMeta();
  const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = ? LIMIT 1", [role]);
  if (!roleRows[0]) {
    throw new Error("Vai tro khong hop le");
  }
  const [result] = await pool.query(
    `INSERT INTO users (${meta.nameCol}, email, ${meta.passwordCol}, role_id)
      VALUES (?, ?, ?, ?)`,
    [fullName, email, passwordHash, roleRows[0].id],
  );
  return result.insertId;
}

export async function createSession({ userId, refreshToken, expiresAt }) {
  await pool.query(
    "INSERT INTO auth_sessions (user_id, refresh_token, expires_at) VALUES (?, ?, ?)",
    [userId, refreshToken, expiresAt],
  );
}

export async function findSessionByRefreshToken(refreshToken) {
  const [rows] = await pool.query(
    "SELECT id, user_id, expires_at, revoked_at FROM auth_sessions WHERE refresh_token = ? LIMIT 1",
    [refreshToken],
  );
  return rows[0] || null;
}

export async function revokeSession(sessionId) {
  await pool.query("UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ?", [sessionId]);
}

export async function createLoginOtp({ userId, otpCode, expiresAt }) {
  await pool.query(
    `INSERT INTO login_otp_codes (user_id, otp_code, expires_at)
      VALUES (?, ?, ?)`,
    [userId, otpCode, expiresAt],
  );
}

export async function getValidOtp({ userId, otpCode }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, otp_code, expires_at, used_at
      FROM login_otp_codes
      WHERE user_id = ? AND otp_code = ?
      ORDER BY id DESC
      LIMIT 1`,
    [userId, otpCode],
  );
  return rows[0] || null;
}

export async function markOtpUsed(otpId) {
  await pool.query("UPDATE login_otp_codes SET used_at = NOW() WHERE id = ?", [otpId]);
}
