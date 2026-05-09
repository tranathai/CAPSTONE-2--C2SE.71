import { Router } from "express";
import { getMyTeam, getTeam, getTeams, getMySuperviseeTeams, createNewTeam, updateExistingTeam, removeTeam, addMember, removeMember } from "../controllers/team.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/me", requireAuth, getMyTeam);
router.get("/", requireAuth, getTeams);
router.get("/supervisees", requireAuth, requireRole("supervisor"), getMySuperviseeTeams);
router.get("/:id", requireAuth, getTeam);

// Admin/Supervisor
router.post("/", requireAuth, requireRole("admin"), createNewTeam);
router.put("/:id", requireAuth, requireRole("admin", "supervisor"), updateExistingTeam);
router.delete("/:id", requireAuth, requireRole("admin"), removeTeam);
router.post("/:id/members", requireAuth, requireRole("admin", "supervisor"), addMember);
router.delete("/:id/members", requireAuth, requireRole("admin", "supervisor"), removeMember);

export default router;
