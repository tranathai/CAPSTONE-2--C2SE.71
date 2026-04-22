import { Router } from "express";
import { param } from "express-validator";
import {
  getMyNotifications,
  readNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const notificationRouter = Router();

notificationRouter.get("/", protect, getMyNotifications);
notificationRouter.patch(
  "/:id/read",
  protect,
  param("id").isInt({ min: 1 }),
  validateRequest,
  readNotification,
);

export default notificationRouter;
