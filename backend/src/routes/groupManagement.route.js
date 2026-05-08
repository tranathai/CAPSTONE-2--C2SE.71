import express from "express";

import {
  getGroups,
  createGroupController,
  deleteGroupController,
  getStudentsController,
  getMentorsController,
  updateGroupController,
} from "../controllers/groupManagement.controller.js";

const router = express.Router();

router.get("/", getGroups);

router.get("/students", getStudentsController);

router.get("/mentors", getMentorsController);

router.post("/", createGroupController);

router.put("/:id", updateGroupController);

router.delete("/:id", deleteGroupController);

export default router;