import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  createLoginOtp,
  createSession,
  createUser,
  findSessionByRefreshToken,
  findUserByEmail,
  getValidOtp,
  findUserById,
  markOtpUsed,
  revokeSession,
} from "../models/auth.model.js";
import { sendMail } from "../utils/mailer.js";

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "dev_secret_change_me", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
}

function generatePendingToken(userId) {
  return jwt.sign(
    { id: userId, purpose: "login_2fa" },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "10m" },
  );
}

async function issueOtpForUser(user) {
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await createLoginOtp({ userId: user.id, otpCode, expiresAt });
  await sendMail({
    to: user.email,
    subject: "Your MentorAI OTP",
    html: `<p>OTP cua ban la: <strong>${otpCode}</strong> (hieu luc 5 phut).</p>`,
  });
  return {
    pendingToken: generatePendingToken(user.id),
    devOtp:
      process.env.NODE_ENV !== "production" ||
      String(process.env.AUTH_DEBUG_OTP || "").toLowerCase() === "true"
        ? otpCode
        : undefined,
  };
}

async function generateRefreshSession(userId) {
  const refreshToken = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await createSession({ userId, refreshToken, expiresAt });
  return refreshToken;
}

function userPayload(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone || "",
    role: user.role,
  };
}

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email da duoc su dung" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultName = email.split("@")[0];
    const userId = await createUser({
      fullName: defaultName,
      email,
      passwordHash,
      role: "student",
    });
    const user = await findUserById(userId);
    const otpIssue = await issueOtpForUser(user);
    return res.status(201).json({
      success: true,
      message: "Dang ky thanh cong. Vui long xac thuc OTP.",
      pendingToken: otpIssue.pendingToken,
      devOtp: otpIssue.devOtp,
      user: userPayload(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user || user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong dung",
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong dung",
      });
    }

    const otpIssue = await issueOtpForUser(user);
    return res.status(200).json({
      success: true,
      message: "Vui long nhap OTP de hoan tat dang nhap",
      pendingToken: otpIssue.pendingToken,
      devOtp: otpIssue.devOtp,
      user: userPayload(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyLoginOtp(req, res, next) {
  try {
    const { pendingToken, otpCode } = req.body;
    const normalizedOtp = String(otpCode || "").trim();
    const decoded = jwt.verify(
      pendingToken,
      process.env.JWT_SECRET || "dev_secret_change_me",
    );
    if (decoded.purpose !== "login_2fa") {
      return res.status(401).json({ success: false, message: "Pending token khong hop le" });
    }
    const otp = await getValidOtp({ userId: decoded.id, otpCode: normalizedOtp });
    if (!otp || otp.used_at || new Date(otp.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: "OTP khong hop le hoac het han" });
    }
    await markOtpUsed(otp.id);
    const user = await findUserById(decoded.id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "Tai khoan khong hop le" });
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshSession(user.id);
    return res.status(200).json({
      success: true,
      message: "Dang nhap thanh cong",
      token: accessToken,
      refreshToken,
      user: userPayload(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function resendLoginOtp(req, res, next) {
  try {
    const { pendingToken } = req.body;
    const decoded = jwt.verify(
      pendingToken,
      process.env.JWT_SECRET || "dev_secret_change_me",
    );
    if (decoded.purpose !== "login_2fa") {
      return res.status(401).json({ success: false, message: "Pending token khong hop le" });
    }
    const user = await findUserById(decoded.id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "Tai khoan khong hop le" });
    }
    const otpIssue = await issueOtpForUser(user);
    return res.status(200).json({
      success: true,
      message: "Da gui lai OTP",
      pendingToken: otpIssue.pendingToken,
      devOtp: otpIssue.devOtp,
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const refreshTokenValue = req.body.refreshToken;
    const session = await findSessionByRefreshToken(refreshTokenValue);
    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ success: false, message: "Refresh token khong hop le" });
    }
    const user = await findUserById(session.user_id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ success: false, message: "Tai khoan khong hop le" });
    }
    const token = generateAccessToken(user);
    return res.status(200).json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshTokenValue = req.body.refreshToken;
    if (refreshTokenValue) {
      const session = await findSessionByRefreshToken(refreshTokenValue);
      if (session) {
        await revokeSession(session.id);
      }
    }
    return res.status(200).json({ success: true, message: "Dang xuat thanh cong" });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Khong tim thay nguoi dung" });
    }
    return res.status(200).json({
      success: true,
      user: userPayload(user),
    });
  } catch (error) {
    return next(error);
  }
}
