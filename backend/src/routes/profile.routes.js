import { Router } from "express";
import { body } from "express-validator";
import { getMyProfile, updateMyProfile } from "../controllers/profile.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const profileRouter = Router();

profileRouter.get("/me", protect, getMyProfile);
profileRouter.put(
  "/me",
  protect,
  body("fullName").trim().notEmpty(),
  body("phone").optional().isString(),
  validateRequest,
  updateMyProfile,
);

export default profileRouter;
