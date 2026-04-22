import { Router } from "express";
import { body, param } from "express-validator";
import { getAuditLogs, listUsers, setUserStatus } from "../controllers/admin.controller.js";
import { protect, requireRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.js";

const adminRouter = Router();

adminRouter.use(protect, requireRoles("admin"));
adminRouter.get("/users", listUsers);
adminRouter.patch(
  "/users/:id/status",
  param("id").isInt({ min: 1 }),
  body("status").isIn(["active", "inactive"]),
  validateRequest,
  setUserStatus,
);
adminRouter.get("/logs", getAuditLogs);

export default adminRouter;
