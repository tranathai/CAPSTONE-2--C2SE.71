import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

const users = [];

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "temporary_secret_key",
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, fullName, role } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const existing = users.find((item) => item.email === normalizedEmail);
  if (existing) {
    return res
      .status(400)
      .json({ success: false, message: "Email da duoc su dung" });
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    password: String(password || ""),
    fullName: String(fullName || "").trim(),
    role,
  };

  users.push(user);

  return res.status(201).json({
    success: true,
    message: "Dang ky thanh cong",
    token: generateToken(user.id),
    user: sanitizeUser(user),
  });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, role } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  let user = users.find((item) => item.email === normalizedEmail);

  if (!user) {
    const inferredName = normalizedEmail.split("@")[0] || "User";
    user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: normalizedEmail,
      password: rawPassword,
      fullName: inferredName,
      role,
    };
    users.push(user);
  }

  if (user.role !== role) {
    return res
      .status(401)
      .json({ success: false, message: "Vai tro khong khop voi tai khoan" });
  }

  if (user.password !== rawPassword) {
    return res
      .status(401)
      .json({ success: false, message: "Email hoac mat khau khong dung" });
  }

  return res.status(200).json({
    success: true,
    message: "Dang nhap thanh cong",
    token: generateToken(user.id),
    user: sanitizeUser(user),
  });
}

export async function getMe(req, res) {
  const user = users.find((item) => item.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Khong tim thay nguoi dung" });
  }

  return res.status(200).json({ success: true, user: sanitizeUser(user) });
}

export async function lookupUserByEmail(req, res) {
  const normalizedEmail = String(req.query?.email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({
      success: false,
      message: "Email khong duoc de trong",
    });
  }

  const user = users.find((item) => item.email === normalizedEmail);

  if (!user) {
    return res.status(200).json({
      success: true,
      data: { exists: false },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      exists: true,
      user: sanitizeUser(user),
    },
  });
}
