import {
  createSubmissionWithVersion,
  findAllSubmissions,
  findSubmissionReviewById,
} from "../models/submission.model.js";
import { findFeedbacksByVersionId } from "../models/feedback.model.js";

export async function listSubmissionsService({ teamId }) {
  return findAllSubmissions({ teamId });
}

export async function getSubmissionByIdService(submissionId) {
  const submission = await findSubmissionReviewById(submissionId);
  if (!submission) return null;
  const feedbacks = await findFeedbacksByVersionId(submission.submission_version_id);
  return { ...submission, feedbacks };
}

export async function uploadSubmissionService(payload) {
  return createSubmissionWithVersion(payload);
}
