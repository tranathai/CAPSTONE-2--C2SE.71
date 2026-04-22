import { Router } from "express";
import { body } from "express-validator";
import { summarizeText } from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const aiRouter = Router();

aiRouter.post(
  "/summarize",
  protect,
  body("text").isString().isLength({ min: 1, max: 20000 }),
  validateRequest,
  summarizeText,
);

export default aiRouter;
