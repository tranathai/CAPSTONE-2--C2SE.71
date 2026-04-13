import { Router } from "express";
import {
  getSubmissionById,
  listSubmissions,
  uploadSubmission,
} from "../controllers/submission.controller.js";
import { submissionUploadMiddleware } from "../middleware/upload.js";

const submissionRouter = Router();

submissionRouter.get("/", listSubmissions);
submissionRouter.post(
  "/upload",
  submissionUploadMiddleware,
  uploadSubmission,
);
submissionRouter.get("/:id", getSubmissionById);

export default submissionRouter;
