import { Router } from "express";
import { getTeams } from "../controllers/team.controller.js";

const teamRouter = Router();

teamRouter.get("/", getTeams);

export default teamRouter;
