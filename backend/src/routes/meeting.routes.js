import { Router } from "express";
import { getMeetings, getUpcoming, getMeeting, create, update, remove, requestMeeting, getSupervisorRequests, approveMeetingRequest, declineMeetingRequest, getStudentMeetingRequests } from "../controllers/meeting.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roleGuard.js";

const router = Router();

router.get("/", requireAuth, getMeetings);
router.get("/upcoming", requireAuth, getUpcoming);
router.get("/requests", requireAuth, requireRole("student"), getStudentMeetingRequests);
router.get("/requests/supervisor", requireAuth, requireRole("supervisor"), getSupervisorRequests);
router.get("/:id", requireAuth, getMeeting);
router.post("/", requireAuth, requireRole("supervisor", "admin"), create);
router.put("/:id", requireAuth, requireRole("supervisor", "admin"), update);
router.delete("/:id", requireAuth, requireRole("supervisor", "admin"), remove);
router.post("/request", requireAuth, requireRole("student"), requestMeeting);
router.put("/request/:requestId/approve", requireAuth, requireRole("supervisor"), approveMeetingRequest);
router.put("/request/:requestId/decline", requireAuth, requireRole("supervisor"), declineMeetingRequest);

export default router;
