import pool from "../config/db.js";

let profileMetaPromise;

async function getProfileMeta() {
  if (!profileMetaPromise) {
    profileMetaPromise = pool
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const names = new Set(rows.map((row) => row.Field));
        return {
          nameCol: names.has("full_name") ? "full_name" : names.has("name") ? "name" : null,
          hasPhone: names.has("phone"),
          hasStatus: names.has("status"),
        };
      })
      .catch((error) => {
        profileMetaPromise = null;
        throw error;
      });
  }
  return profileMetaPromise;
}

export async function getProfileByUserId(userId) {
  const meta = await getProfileMeta();
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

export async function updateProfileByUserId(userId, { fullName, phone }) {
  const meta = await getProfileMeta();
  if (meta.hasPhone) {
    await pool.query(
      `UPDATE users SET ${meta.nameCol} = ?, phone = ? WHERE id = ?`,
      [fullName, phone || null, userId],
    );
  } else {
    await pool.query(`UPDATE users SET ${meta.nameCol} = ? WHERE id = ?`, [fullName, userId]);
  }
  return getProfileByUserId(userId);
}
