// src/routes/teamManager.routes.js

import { Router } from "express";
import {
  getTeamManagement,
  getTeamManagementMentor,
} from "../controllers/teamManager.controller.js";

const router = Router();

// student
router.get("/management", getTeamManagement);

// mentor
router.get("/mentor", getTeamManagementMentor);

export default router;