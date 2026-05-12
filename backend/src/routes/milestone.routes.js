import { Router } from "express";
import { getMilestones, getMilestone, getUpcomingMilestones, create, update, remove, getGraduationBatches, createBatch, updateBatch, removeBatch } from "../controllers/milestone.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/", requireAuth, getMilestones);
router.get("/batches", requireAuth, getGraduationBatches);
router.get("/upcoming", requireAuth, getUpcomingMilestones);
router.get("/:id", requireAuth, getMilestone);

// Admin only
router.post("/", requireAuth, requireRole("admin"), create);
router.post("/batches", requireAuth, requireRole("admin"), createBatch);
router.put("/:id", requireAuth, requireRole("admin"), update);
router.put("/batches/:id", requireAuth, requireRole("admin"), updateBatch);
router.delete("/:id", requireAuth, requireRole("admin"), remove);
router.delete("/batches/:id", requireAuth, requireRole("admin"), removeBatch);

export default router;
