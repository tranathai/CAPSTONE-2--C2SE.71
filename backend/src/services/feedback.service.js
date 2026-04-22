import {
  createFeedback,
  doesSubmissionVersionExist,
  findFeedbacksByVersionId,
  findUserRoleById,
} from "../models/feedback.model.js";

export async function getFeedbacksByVersionService(versionId) {
  return findFeedbacksByVersionId(versionId);
}

export async function createFeedbackService({
  submissionVersionId,
  supervisorId,
  content,
}) {
  const submissionVersionExists = await doesSubmissionVersionExist(submissionVersionId);
  if (!submissionVersionExists) {
    const error = new Error("submission version khong ton tai");
    error.status = 404;
    throw error;
  }

  const roleName = await findUserRoleById(supervisorId);
  if (!roleName) {
    const error = new Error("supervisor khong ton tai");
    error.status = 404;
    throw error;
  }
  if (roleName !== "supervisor" && roleName !== "mentor") {
    const error = new Error("Chi mentor/supervisor moi duoc tao feedback");
    error.status = 403;
    throw error;
  }

  const feedbackId = await createFeedback({
    submissionVersionId,
    supervisorId,
    content,
  });

  return {
    id: feedbackId,
    submission_version_id: submissionVersionId,
    supervisor_id: supervisorId,
    content,
  };
}
