import { Router } from "express";
import {
  getFeedbacksByVersionId,
  postFeedback,
} from "../controllers/feedback.controller.js";

const feedbackRouter = Router();

feedbackRouter.get("/:versionId", getFeedbacksByVersionId);
feedbackRouter.post("/", postFeedback);

export default feedbackRouter;
