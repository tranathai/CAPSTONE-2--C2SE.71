import { Router } from "express";
import { body } from "express-validator";
import {
  getTeacherRequests,
  handleTeacherRequestAction,
  submitTeacherRequest,
} from "../controllers/teacher-request.controller.js";
import { protect, requireRoles } from "../middleware/auth.middleware.js";
import { teacherRequestUploadMiddleware } from "../middleware/teacher-request-upload.js";
import { validateRequest } from "../middleware/validation.js";

const teacherRequestRouter = Router();

teacherRequestRouter.post(
  "/",
  protect,
  requireRoles("student"),
  teacherRequestUploadMiddleware,
  body("experienceText").isString().isLength({ min: 20 }),
  validateRequest,
  submitTeacherRequest,
);

teacherRequestRouter.get(
  "/",
  protect,
  requireRoles("admin"),
  getTeacherRequests,
);

teacherRequestRouter.get("/action", handleTeacherRequestAction);

export default teacherRequestRouter;
