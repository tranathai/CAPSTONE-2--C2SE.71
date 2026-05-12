import bcrypt from "bcryptjs";
import {
  getStudentProfile,
  getSupervisorProfile,
  updateUserProfile,
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  findUserWithStudentCode,
} from "../models/user.model.js";
import { createNotification } from "../models/notification.model.js";
import { findUserByEmail } from "../models/user.model.js";
import pool from "../config/db.js";

const PHONE_REGEX = /^0\d{8}$/;
const USER_CODE_REGEX = /^\d{11}$/;

async function isUserCodeExists(userCode) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM (
       SELECT student_code AS code FROM student_profiles WHERE student_code IS NOT NULL AND student_code <> ''
       UNION ALL
       SELECT lecturer_code AS code FROM supervisor_profiles WHERE lecturer_code IS NOT NULL AND lecturer_code <> ''
     ) all_codes
     WHERE all_codes.code = ?
     LIMIT 1`,
    [userCode],
  );
  return rows.length > 0;
}

export async function getMyProfile(req, res, next) {
  try {
    const userId = req.user.id;
    let profile;
    if (req.user.role_name === "student") {
      profile = await getStudentProfile(userId);
    } else if (req.user.role_name === "supervisor") {
      profile = await getSupervisorProfile(userId);
    } else {
      const [rows] = await pool.query(
        `SELECT id, email, full_name, phone, avatar_url, is_active, created_at FROM users WHERE id = ?`,
        [userId],
      );
      profile = rows[0];
    }
    if (!profile) return res.status(404).json({ success: false, message: "Không tìm thấy hồ sơ" });
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { full_name, phone, avatar_url } = req.body;

    await updateUserProfile(userId, { fullName: full_name, phone, avatarUrl: avatar_url });
    return res.status(200).json({ success: true, message: "Cập nhật hồ sơ thành công" });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    const { role, status, search } = req.query;
    const users = await listUsers({ role, status, search });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function createNewUser(req, res, next) {
  try {
    const { email, password, full_name, role: roleName, phone, user_code } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email không được để trống" });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "Họ tên không được để trống" });
    }
    if (!roleName || !["student", "supervisor"].includes(roleName)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }
    const normalizedPhone = String(phone || "").trim();
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({ success: false, message: "Số điện thoại phải có 9 chữ số và bắt đầu bằng 0" });
    }
    const normalizedUserCode = String(user_code || "").trim();
    if (!USER_CODE_REGEX.test(normalizedUserCode)) {
      return res.status(400).json({ success: false, message: "ID phải gồm đúng 11 chữ số" });
    }
    if (await isUserCodeExists(normalizedUserCode)) {
      return res.status(409).json({ success: false, message: "ID đã tồn tại trong hệ thống" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: "Email đã tồn tại trong hệ thống" });
    }

    const [roleRows] = await pool.query(`SELECT id FROM roles WHERE name = ?`, [roleName]);
    if (!roleRows.length) {
      return res.status(400).json({ success: false, message: "Vai trò không tồn tại" });
    }
    const roleId = roleRows[0].id;

    // Hash password (allow empty for admin-created accounts)
    let passwordHash = "$2b$10$empty"; // placeholder for empty password
    if (password && password.length > 0) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const userId = await createUser({
      email: normalizedEmail,
      passwordHash,
      fullName: full_name.trim(),
      roleId,
      phone: normalizedPhone,
    });

    // Create profile
    if (roleName === "student") {
      await pool.query(`INSERT INTO student_profiles (user_id, student_code) VALUES (?, ?)`, [userId, normalizedUserCode]);
    } else if (roleName === "supervisor") {
      await pool.query(`INSERT INTO supervisor_profiles (user_id, lecturer_code) VALUES (?, ?)`, [userId, normalizedUserCode]);
    }

    return res.status(201).json({ success: true, message: "Tạo tài khoản thành công", data: { id: userId } });
  } catch (error) {
    next(error);
  }
}

function normalizeRoleFromCsv(rawRole) {
  const v = String(rawRole || "").trim().toLowerCase();
  if (["student", "sinh vien", "sinh viên", "sv"].includes(v)) return "student";
  if (["supervisor", "giang vien", "giảng viên", "gv", "teacher", "mentor"].includes(v)) return "supervisor";
  return null;
}

export async function importUsersFromCsv(req, res, next) {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "Không có dữ liệu CSV để import" });
    }
    if (rows.length > 1000) {
      return res.status(400).json({ success: false, message: "File quá lớn (tối đa 1000 dòng mỗi lần)" });
    }

    const [roleRows] = await pool.query(`SELECT id, name FROM roles WHERE name IN ('student', 'supervisor')`);
    const roleMap = new Map(roleRows.map((r) => [r.name, r.id]));
    const studentRoleId = roleMap.get("student");
    const supervisorRoleId = roleMap.get("supervisor");
    if (!studentRoleId || !supervisorRoleId) {
      return res.status(400).json({ success: false, message: "Thiếu role student/supervisor trong hệ thống" });
    }

    const results = [];
    let created = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const lineNumber = i + 2; // +1 header +1 index base
      const row = rows[i] || {};
      const mssv = String(row.mssv || "").trim();
      const fullName = String(row.full_name || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      const roleName = normalizeRoleFromCsv(row.role);
      const password = String(row.password || "").trim();

      if (!fullName || !email || !roleName) {
        results.push({ line: lineNumber, email, status: "failed", message: "Thiếu họ tên/email/vai trò hợp lệ" });
        continue;
      }
      if (!USER_CODE_REGEX.test(mssv)) {
        results.push({ line: lineNumber, email, status: "failed", message: "ID phải gồm đúng 11 chữ số" });
        continue;
      }
      if (await isUserCodeExists(mssv)) {
        results.push({ line: lineNumber, email, status: "failed", message: "ID đã tồn tại" });
        continue;
      }

      const exists = await findUserByEmail(email);
      if (exists) {
        results.push({ line: lineNumber, email, status: "failed", message: "Email đã tồn tại" });
        continue;
      }

      const passwordForCreate = password || "0";
      const passwordHash = await bcrypt.hash(passwordForCreate, 10);

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [uResult] = await conn.query(
          `INSERT INTO users (email, password_hash, full_name, role_id, phone) VALUES (?, ?, ?, ?, NULL)`,
          [email, passwordHash, fullName, roleName === "student" ? studentRoleId : supervisorRoleId],
        );
        const userId = uResult.insertId;

        if (roleName === "student") {
          await conn.query(`INSERT INTO student_profiles (user_id, student_code) VALUES (?, ?)`, [userId, mssv || null]);
        } else {
          await conn.query(`INSERT INTO supervisor_profiles (user_id, lecturer_code) VALUES (?, ?)`, [userId, mssv || null]);
        }

        await conn.commit();
        created += 1;
        results.push({ line: lineNumber, email, status: "created" });
      } catch (e) {
        await conn.rollback();
        results.push({ line: lineNumber, email, status: "failed", message: e?.message || "Tạo tài khoản thất bại" });
      } finally {
        conn.release();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Import xong: ${created}/${rows.length} tài khoản`,
      data: {
        total: rows.length,
        created,
        failed: rows.length - created,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(req, res, next) {
  try {
    const { userId } = req.params;
    const { role: roleName } = req.body;

    if (!["student", "supervisor"].includes(roleName)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
    }

    const [roleRows] = await pool.query(`SELECT id FROM roles WHERE name = ?`, [roleName]);
    if (!roleRows.length) {
      return res.status(400).json({ success: false, message: "Vai trò không tồn tại" });
    }

    await updateUserRole(Number(userId), roleRows[0].id);
    return res.status(200).json({ success: true, message: "Cập nhật vai trò thành công" });
  } catch (error) {
    next(error);
  }
}

export async function lockUnlockUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    await toggleUserActive(Number(userId), Boolean(is_active));

    // Notify user
    await createNotification({
      userId: Number(userId),
      title: is_active ? "Tài khoản đã được kích hoạt" : "Tài khoản đã bị khóa",
      message: is_active
        ? "Tài khoản của bạn đã được quản trị viên kích hoạt trở lại."
        : "Tài khoản của bạn đã bị quản trị viên khóa. Vui lòng liên hệ để được hỗ trợ.",
      type: "system",
    });

    return res.status(200).json({
      success: true,
      message: is_active ? "Đã kích hoạt tài khoản" : "Đã khóa tài khoản",
    });
  } catch (error) {
    next(error);
  }
}
