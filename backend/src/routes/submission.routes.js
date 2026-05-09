import { Router } from "express";
import { listSubmissions, getSubmission, uploadSubmission, getMySubmissions, getSupervisorSubmissions, getDashboardStats, getMySubmissionsByTeam, studentUploadSubmission, updateSubmission, deleteVersion, getSubmissionsByMilestone } from "../controllers/submission.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";
import { uploadSingle } from "../middleware/upload.js";

const router = Router();

router.get("/", requireAuth, listSubmissions);
router.get("/my", requireAuth, requireRole("student"), getMySubmissions);
router.get("/my/team/:teamId", requireAuth, requireRole("student"), getMySubmissionsByTeam);
router.get("/supervisor", requireAuth, requireRole("supervisor"), getSupervisorSubmissions);
router.get("/stats", requireAuth, requireRole("supervisor"), getDashboardStats);
router.get("/:id", requireAuth, getSubmission);

// Student management routes
router.post("/student/upload", requireAuth, requireRole("student"), uploadSingle("file"), studentUploadSubmission);
router.put("/:id", requireAuth, requireRole("student"), updateSubmission);
router.delete("/version/:versionId", requireAuth, requireRole("student"), deleteVersion);
router.get("/team/:teamId/milestone/:milestoneId", requireAuth, getSubmissionsByMilestone);

export default router;
