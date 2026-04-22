import { Router } from "express";
import { body, param } from "express-validator";
import {
  approveTopic,
  createTopicRequest,
  getTopics,
  rejectTopic,
} from "../controllers/topic.controller.js";
import { protect, requireRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const topicRouter = Router();

topicRouter.get("/", protect, getTopics);
topicRouter.post(
  "/",
  protect,
  requireRoles("student"),
  body("title").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("technologiesUsed").trim().notEmpty(),
  validateRequest,
  createTopicRequest,
);
topicRouter.patch(
  "/:id/approve",
  protect,
  requireRoles("supervisor"),
  param("id").isInt({ min: 1 }),
  validateRequest,
  approveTopic,
);
topicRouter.patch(
  "/:id/reject",
  protect,
  requireRoles("supervisor"),
  param("id").isInt({ min: 1 }),
  body("rejectionReason").trim().notEmpty(),
  validateRequest,
  rejectTopic,
);

export default topicRouter;
