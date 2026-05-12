import { Router } from "express";
import { getMyProfile, updateMyProfile, getUsers, createNewUser, importUsersFromCsv, changeUserRole, lockUnlockUser } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateMyProfile);

// Admin only
router.get("/", requireAuth, requireRole("admin", "supervisor"), getUsers);
router.post("/", requireAuth, requireRole("admin"), createNewUser);
router.post("/import-csv", requireAuth, requireRole("admin"), importUsersFromCsv);
router.put("/:userId/role", requireAuth, requireRole("admin"), changeUserRole);
router.put("/:userId/status", requireAuth, requireRole("admin"), lockUnlockUser);

export default router;
