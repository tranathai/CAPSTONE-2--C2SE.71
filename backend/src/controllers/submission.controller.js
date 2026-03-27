import { findSubmissionReviewById } from "../models/submission.model.js";

export async function getSubmissionById(req, res, next) {
  try {
    const submissionId = Number(req.params.id);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "submission id không hợp lệ",
      });
    }

    const submission = await findSubmissionReviewById(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy submission",
      });
    }

    return res.status(200).json({
      success: true,
      data: submission,
    });
  } catch (error) {
    return next(error);
  }
}
