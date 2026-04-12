import { Router } from "express";
import { getMilestones } from "../controllers/milestone.controller.js";

const milestoneRouter = Router();

milestoneRouter.get("/", getMilestones);

export default milestoneRouter;
