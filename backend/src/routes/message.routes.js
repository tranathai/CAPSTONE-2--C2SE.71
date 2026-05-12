import { Router } from "express";
import {
  getConversation,
  getContactList,
  send,
  getUnreadCount,
  getTopicMessages,
  getUserTopicsWithMessages,
  getGroupList,
  getGroupMessages,
  sendGroup,
} from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/contacts", requireAuth, getContactList);
router.get("/conversation/:userId", requireAuth, getConversation);
router.get("/unread-count", requireAuth, getUnreadCount);
router.post("/", requireAuth, send);
router.get("/groups", requireAuth, getGroupList);
router.get("/groups/:teamId", requireAuth, getGroupMessages);
router.post("/groups/send", requireAuth, sendGroup);

// Topic-based messages
router.get("/topics", requireAuth, getUserTopicsWithMessages);
router.get("/topics/:topicId", requireAuth, getTopicMessages);

export default router;
