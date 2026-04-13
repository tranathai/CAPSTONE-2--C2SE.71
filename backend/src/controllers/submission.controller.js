import fs from "fs/promises";
import {
  createSubmissionWithVersion,
  findAllSubmissions,
  findSubmissionReviewById,
} from "../models/submission.model.js";
import { findFeedbacksByVersionId } from "../models/feedback.model.js";

export async function listSubmissions(req, res, next) {
  try {
    const teamIdRaw = req.query.team_id;
    const teamId =
      teamIdRaw != null && teamIdRaw !== ""
        ? Number(teamIdRaw)
        : null;

    if (teamId != null && (!Number.isInteger(teamId) || teamId <= 0)) {
      return res.status(400).json({
        success: false,
        message: "team_id không hợp lệ",
      });
    }

    const rows = await findAllSubmissions({ teamId });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

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

    const feedbacks = await findFeedbacksByVersionId(
      submission.submission_version_id,
    );

    return res.status(200).json({
      success: true,
      data: { ...submission, feedbacks },
    });
  } catch (error) {
    return next(error);
  }
}

export async function uploadSubmission(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Thiếu file upload",
      });
    }

    const teamId = Number(req.body.team_id);
    const milestoneId =
      req.body.milestone_id != null && req.body.milestone_id !== ""
        ? Number(req.body.milestone_id)
        : null;

    if (!Number.isInteger(teamId) || teamId <= 0) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "team_id không hợp lệ",
      });
    }

    if (
      milestoneId != null &&
      (!Number.isInteger(milestoneId) || milestoneId <= 0)
    ) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: "milestone_id không hợp lệ",
      });
    }

    const title =
      typeof req.file.originalname === "string" && req.file.originalname
        ? req.file.originalname
        : "Submission";
    const publicPath = `/uploads/${req.file.filename}`;

    try {
      const result = await createSubmissionWithVersion({
        teamId,
        milestoneId,
        title,
        filePath: publicPath,
      });

      return res.status(201).json({
        success: true,
        message: "Upload thành công",
        data: result,
      });
    } catch (dbError) {
      await fs.unlink(req.file.path).catch(() => {});
      if (dbError?.code === "ER_BAD_FIELD_ERROR") {
        return res.status(500).json({
          success: false,
          message:
            "Schema DB thiếu cột (ví dụ milestone_id trên submissions). Xem sql/add-submission-milestone.sql",
        });
      }
      throw dbError;
    }
  } catch (error) {
    return next(error);
  }
}
