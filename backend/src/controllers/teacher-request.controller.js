import crypto from "crypto";
import { sendMail } from "../utils/mailer.js";
import {
  assignSupervisorRole,
  createTeacherRequest,
  decideTeacherRequest,
  findTeacherRequestByActionToken,
  listTeacherRequests,
} from "../models/teacher-request.model.js";

function buildActionLink(action, token) {
  const baseUrl = process.env.PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/api/teacher-requests/action?token=${encodeURIComponent(token)}&action=${action}`;
}

export async function submitTeacherRequest(req, res, next) {
  try {
    const cvFilePath = req.files?.cvFile?.[0]?.path?.replace(/\\/g, "/");
    const degreeFilePath = req.files?.degreeFile?.[0]?.path?.replace(/\\/g, "/");
    const experienceText = req.body.experienceText?.trim();
    if (!cvFilePath || !degreeFilePath || !experienceText) {
      return res.status(400).json({
        success: false,
        message: "Can upload CV, bang cap va mo ta kinh nghiem",
      });
    }
    const actionToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const requestId = await createTeacherRequest({
      userId: req.user.id,
      cvFilePath: `/${cvFilePath}`,
      degreeFilePath: `/${degreeFilePath}`,
      experienceText,
      actionToken,
      tokenExpiresAt,
    });

    const approveLink = buildActionLink("approve", actionToken);
    const rejectLink = buildActionLink("reject", actionToken);
    await sendMail({
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: "Teacher Request Pending",
      html: `
        <p>User #${req.user.id} muon tro thanh instructor.</p>
        <p>CV: <a href="${approveLink.replace("/api/teacher-requests/action", "")}">${cvFilePath}</a></p>
        <p><a href="${approveLink}">Approve</a> | <a href="${rejectLink}">Reject</a></p>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Gui yeu cau tro thanh instructor thanh cong",
      data: { id: requestId, status: "pending" },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTeacherRequests(req, res, next) {
  try {
    const status = req.query.status || null;
    const rows = await listTeacherRequests(status);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function handleTeacherRequestAction(req, res, next) {
  try {
    const { token, action } = req.query;
    if (!token || (action !== "approve" && action !== "reject")) {
      return res.status(400).json({ success: false, message: "Link xu ly khong hop le" });
    }
    const request = await findTeacherRequestByActionToken(token);
    if (!request) {
      return res.status(404).json({ success: false, message: "Yeu cau khong ton tai" });
    }
    if (new Date(request.token_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "Link da het han" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Yeu cau da duoc xu ly" });
    }
    const status = action === "approve" ? "approved" : "rejected";
    await decideTeacherRequest({
      requestId: request.id,
      status,
      adminNote: `Processed via magic link (${action})`,
    });
    if (status === "approved") {
      await assignSupervisorRole(request.user_id);
    }
    return res.status(200).json({
      success: true,
      message: `Yeu cau da duoc ${status}`,
    });
  } catch (error) {
    return next(error);
  }
}
