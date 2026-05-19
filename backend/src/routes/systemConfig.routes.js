import { Router } from "express";
import { getAllConfig, updateConfig } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), getAllConfig);
router.put("/", requireAuth, requireRole("admin"), updateConfig);

export default router;
