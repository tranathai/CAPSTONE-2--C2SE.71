import { Router } from "express";
import { getFeedbacksByVersion, submitFeedback, updateExistingFeedback } from "../controllers/feedback.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/version/:versionId", requireAuth, getFeedbacksByVersion);
router.post("/", requireAuth, requireRole("supervisor"), submitFeedback);
router.put("/:id", requireAuth, requireRole("supervisor"), updateExistingFeedback);

export default router;
