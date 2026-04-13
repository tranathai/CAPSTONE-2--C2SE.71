import { findAllMilestones } from "../models/milestone.model.js";

export async function getMilestones(_req, res, next) {
  try {
    const milestones = await findAllMilestones();
    return res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    return next(error);
  }
}
