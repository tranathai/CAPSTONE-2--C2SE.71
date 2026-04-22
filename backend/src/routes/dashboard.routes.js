import { Router } from "express";
import {
  getStudentDashboard,
  getSupervisorDashboard,
} from "../controllers/dashboard.controller.js";
import { protect, requireRoles } from "../middleware/auth.middleware.js";

const dashboardRouter = Router();

dashboardRouter.get("/student", protect, requireRoles("student"), getStudentDashboard);
dashboardRouter.get(
  "/supervisor",
  protect,
  requireRoles("supervisor"),
  getSupervisorDashboard,
);

export default dashboardRouter;
