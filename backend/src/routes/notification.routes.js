import { Router } from "express";
import { getNotifications, getUnreadCount, markRead, markAllNotificationsRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.put("/:id/read", requireAuth, markRead);
router.put("/read-all", requireAuth, markAllNotificationsRead);

export default router;
