import jwt from "jsonwebtoken";
import { findUserById } from "../models/user.model.js";

export function generateToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role_name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Thiếu token xác thực" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Người dùng không tồn tại" });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}
