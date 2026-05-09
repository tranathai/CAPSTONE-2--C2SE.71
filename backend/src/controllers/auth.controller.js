import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import pool from "../config/db.js";

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

function normalizeRole(role) {
  return role === "mentor" ? "teacher" : role;
}

export async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, fullName } = req.body;
  const role = normalizeRole(req.body.role);
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const connection = await pool.getConnection();

  try {
    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email da duoc su dung" });
    }

    const hashedPassword = await bcrypt.hash(String(password || ""), 10);

    const [result] = await connection.query(
      "INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)",
      [normalizedEmail, hashedPassword, String(fullName || "").trim(), role],
    );

    const user = {
      id: result.insertId,
      email: normalizedEmail,
      fullName: String(fullName || "").trim(),
      role,
    };

    return res.status(201).json({
      success: true,
      message: "Dang ky thanh cong",
      token: generateToken(user.id),
      user: sanitizeUser(user),
    });
  } finally {
    connection.release();
  }
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      "SELECT id, email, full_name, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tai khoan chua ton tai. Vui long dang ky truoc khi dang nhap.",
      });
    }

    const user = users[0];

    if (Number(user.is_active) !== 1) {
      return res.status(401).json({
        success: false,
        message: "Tai khoan da bi khoa",
      });
    }

    const isMatch = await bcrypt.compare(rawPassword, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoac mat khau khong dung" });
    }

    return res.status(200).json({
      success: true,
      message: "Dang nhap thanh cong",
      token: generateToken(user.id),
      user: sanitizeUser({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      }),
    });
  } finally {
    connection.release();
  }
}

export async function getMe(req, res) {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      "SELECT id, email, full_name, role FROM users WHERE id = ? LIMIT 1",
      [req.user?.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Khong tim thay nguoi dung" });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      user: sanitizeUser({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      }),
    });
  } finally {
    connection.release();
  }
}

export async function lookupUserByEmail(req, res) {
  const normalizedEmail = String(req.query?.email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({
      success: false,
      message: "Email khong duoc de trong",
    });
  }

  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      "SELECT id, email, full_name, role FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        data: { exists: false },
      });
    }

    const user = users[0];
    return res.status(200).json({
      success: true,
      data: {
        exists: true,
        user: sanitizeUser({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        }),
      },
    });
  } finally {
    connection.release();
  }
}
