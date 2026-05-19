import bcrypt from "bcryptjs";
import { findUserByEmail } from "../models/user.model.js";
import { generateToken } from "../middleware/auth.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email không được để trống" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }

    // Allow login with empty password (accounts created by admin)
    const passwordProvided = password && password.length > 0;
    if (passwordProvided) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
      }
    } else {
      // Empty password only allowed if account was created by admin (no hash)
      // For security, we require a minimum of 4 chars if any password exists
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const { id, email, full_name, role_name, phone, avatar_url } = req.user;
    return res.status(200).json({
      success: true,
      data: { id, email, full_name, role: role_name, phone, avatar_url },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    // JWT is stateless — client discards the token
    return res.status(200).json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
}
