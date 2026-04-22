import { Router } from "express";
import { body } from "express-validator";
import {
  getMe,
  login,
  logout,
  refreshToken,
  register,
  resendLoginOtp,
  verifyLoginOtp,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const authRouter = Router();

const emailRule = body("email")
  .isEmail()
  .withMessage("Email khong dung dinh dang");

const passwordRule = body("password")
  .isLength({ min: 6 })
  .withMessage("Mat khau toi thieu 6 ky tu");

authRouter.post(
  "/register",
  emailRule,
  passwordRule,
  validateRequest,
  register,
);
authRouter.post(
  "/login",
  emailRule,
  body("password").isString().notEmpty(),
  validateRequest,
  login,
);
authRouter.post(
  "/verify-otp",
  body("pendingToken").isString().notEmpty(),
  body("otpCode").isString().isLength({ min: 6, max: 6 }),
  validateRequest,
  verifyLoginOtp,
);
authRouter.post(
  "/resend-otp",
  body("pendingToken").isString().notEmpty(),
  validateRequest,
  resendLoginOtp,
);
authRouter.get("/me", protect, getMe);
authRouter.post(
  "/refresh-token",
  body("refreshToken").isString().notEmpty(),
  validateRequest,
  refreshToken,
);
authRouter.post("/logout", logout);

export default authRouter;
