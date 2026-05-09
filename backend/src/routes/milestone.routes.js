import { Router } from "express";
import { getMilestones, getMilestone, getUpcomingMilestones, create, update, remove } from "../controllers/milestone.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/", requireAuth, getMilestones);
router.get("/upcoming", requireAuth, getUpcomingMilestones);
router.get("/:id", requireAuth, getMilestone);

// Admin only
router.post("/", requireAuth, requireRole("admin"), create);
router.put("/:id", requireAuth, requireRole("admin"), update);
router.delete("/:id", requireAuth, requireRole("admin"), remove);

export default router;
