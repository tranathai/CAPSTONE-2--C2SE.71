import {
  findFeedbacksByVersionId,
  findFeedbackById,
  createFeedback,
  updateFeedback,
  hasFeedback,
} from "../models/feedback.model.js";
import { createNotification } from "../models/notification.model.js";

export async function getFeedbacksByVersion(req, res, next) {
  try {
    const versionId = Number(req.params.versionId);
    if (!versionId || versionId <= 0) {
      return res.status(400).json({ success: false, message: "version id không hợp lệ" });
    }

    const feedbacks = await findFeedbacksByVersionId(versionId);
    return res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    next(error);
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const { submission_version_id, content, is_final } = req.body;
    const supervisorId = req.user.id;

    if (!submission_version_id) {
      return res.status(400).json({ success: false, message: "submission_version_id không hợp lệ" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung feedback không được để trống" });
    }
    if (content.trim().length > 5000) {
      return res.status(400).json({ success: false, message: "Feedback không được vượt quá 5000 ký tự" });
    }

    if (req.user.role_name !== "supervisor") {
      return res.status(403).json({ success: false, message: "Chỉ supervisor mới được tạo feedback" });
    }

    const versionId = Number(submission_version_id);
    const feedbackId = await createFeedback({
      versionId,
      supervisorId,
      content: content.trim(),
      isFinal: Boolean(is_final),
    });

    // Update submission status_label
    const { default: pool } = await import("../config/db.js");
    await pool.query(
      `UPDATE submissions SET status_label = 'Reviewed' WHERE id = (
        SELECT submission_id FROM submission_versions WHERE id = ?
      )`,
      [versionId],
    );

    // Notify team members
    const [subRows] = await pool.query(
      `SELECT sv.submission_id, t.name AS team_name, s.title AS submission_title
       FROM submission_versions sv
       INNER JOIN submissions s ON s.id = sv.submission_id
       INNER JOIN teams t ON t.id = s.team_id
       WHERE sv.id = ?`,
      [versionId],
    );
    if (subRows[0]) {
      const [memberRows] = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = (
          SELECT team_id FROM submissions WHERE id = ?
        )`,
        [subRows[0].submission_id],
      );
      for (const m of memberRows) {
        await createNotification({
          userId: m.user_id,
          title: "Phản hồi mới từ giảng viên",
          message: `Giảng viên đã gửi phản hồi cho bài "${subRows[0].submission_title}"`,
          type: "feedback",
          relatedUrl: `/student/review/${subRows[0].submission_id}`,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Gửi feedback thành công",
      data: { id: feedbackId },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingFeedback(req, res, next) {
  try {
    const feedbackId = Number(req.params.id);
    const { content, is_final } = req.body;
    const supervisorId = req.user.id;

    const existing = await findFeedbackById(feedbackId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Feedback không tồn tại" });
    }
    if (existing.supervisor_id !== supervisorId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa feedback này" });
    }

    await updateFeedback(feedbackId, { content: content?.trim(), isFinal: is_final });
    return res.status(200).json({ success: true, message: "Cập nhật feedback thành công" });
  } catch (error) {
    next(error);
  }
}
