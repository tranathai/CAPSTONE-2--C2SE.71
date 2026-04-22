import { Router } from "express";
import { body, param } from "express-validator";
import { getTeamMessages, postTeamMessage } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const chatRouter = Router();

chatRouter.get(
  "/teams/:teamId/messages",
  protect,
  param("teamId").isInt({ min: 1 }),
  validateRequest,
  getTeamMessages,
);
chatRouter.post(
  "/teams/:teamId/messages",
  protect,
  param("teamId").isInt({ min: 1 }),
  body("body").trim().notEmpty(),
  validateRequest,
  postTeamMessage,
);

export default chatRouter;
