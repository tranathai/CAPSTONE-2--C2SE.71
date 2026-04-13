import {
  createFeedback,
  doesSubmissionVersionExist,
  findFeedbacksByVersionId,
  findUserRoleById,
} from "../models/feedback.model.js";

export async function getFeedbacksByVersionId(req, res, next) {
  try {
    const versionId = Number(req.params.versionId);

    if (!Number.isInteger(versionId) || versionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "version id không hợp lệ",
      });
    }

    const feedbacks = await findFeedbacksByVersionId(versionId);

    return res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    return next(error);
  }
}

export async function postFeedback(req, res, next) {
  try {
    const { submission_version_id, supervisor_id, content } = req.body;

    const submissionVersionId = Number(submission_version_id);
    const supervisorId = Number(supervisor_id);
    const normalizedContent = typeof content === "string" ? content.trim() : "";

    if (!Number.isInteger(submissionVersionId) || submissionVersionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "submission_version_id không hợp lệ",
      });
    }

    if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "supervisor_id không hợp lệ",
      });
    }

    if (!normalizedContent) {
      return res.status(400).json({
        success: false,
        message: "content không được để trống",
      });
    }

    if (normalizedContent.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "content vượt quá giới hạn 5000 ký tự",
      });
    }

    const submissionVersionExists =
      await doesSubmissionVersionExist(submissionVersionId);
    if (!submissionVersionExists) {
      return res.status(404).json({
        success: false,
        message: "submission version không tồn tại",
      });
    }

    const roleName = await findUserRoleById(supervisorId);
    if (!roleName) {
      return res.status(404).json({
        success: false,
        message: "supervisor không tồn tại",
      });
    }

    if (roleName !== "supervisor" && roleName !== "mentor") {
      return res.status(403).json({
        success: false,
        message: "Chỉ mentor/supervisor mới được tạo feedback",
      });
    }

    const feedbackId = await createFeedback({
      submissionVersionId,
      supervisorId,
      content: normalizedContent,
    });

    return res.status(201).json({
      success: true,
      message: "Lưu feedback thành công",
      data: {
        id: feedbackId,
        submission_version_id: submissionVersionId,
        supervisor_id: supervisorId,
        content: normalizedContent,
      },
    });
  } catch (error) {
    return next(error);
  }
}
