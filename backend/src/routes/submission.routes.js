import { Router } from "express";
import { getSubmissionById } from "../controllers/submission.controller.js";

const submissionRouter = Router();

submissionRouter.get("/:id", getSubmissionById);

export default submissionRouter;
