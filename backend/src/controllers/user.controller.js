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
    const { email, password, full_name, role: roleName, phone } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email không được để trống" });
    }
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: "Họ tên không được để trống" });
    }
    if (!roleName || !["student", "supervisor"].includes(roleName)) {
      return res.status(400).json({ success: false, message: "Vai trò không hợp lệ" });
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
      phone: phone || null,
    });

    // Create profile
    if (roleName === "student") {
      await pool.query(`INSERT INTO student_profiles (user_id) VALUES (?)`, [userId]);
    } else if (roleName === "supervisor") {
      await pool.query(`INSERT INTO supervisor_profiles (user_id) VALUES (?)`, [userId]);
    }

    return res.status(201).json({ success: true, message: "Tạo tài khoản thành công", data: { id: userId } });
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
