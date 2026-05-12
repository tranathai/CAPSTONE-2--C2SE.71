import { Router } from "express";
import { summarizeFeedback } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/summarize-feedback", requireAuth, summarizeFeedback);

export default router;
