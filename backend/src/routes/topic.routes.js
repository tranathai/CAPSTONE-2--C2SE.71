import { Router } from "express";
import { registerTopic, getMyTopic, getPendingTopics, approveTopic, rejectTopic, getApprovedTopics, deleteMyTopic } from "../controllers/topic.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.post("/register", requireAuth, requireRole("student"), registerTopic);
router.get("/my", requireAuth, requireRole("student"), getMyTopic);
router.delete("/my", requireAuth, requireRole("student"), deleteMyTopic);

// Supervisor
router.get("/pending", requireAuth, requireRole("supervisor"), getPendingTopics);
router.put("/:topicId/approve", requireAuth, requireRole("supervisor"), approveTopic);
router.put("/:topicId/reject", requireAuth, requireRole("supervisor"), rejectTopic);
router.get("/approved", requireAuth, requireRole("supervisor"), getApprovedTopics);

export default router;
