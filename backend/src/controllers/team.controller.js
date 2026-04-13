import { findAllTeams } from "../models/team.model.js";

export async function getTeams(_req, res, next) {
  try {
    const teams = await findAllTeams();
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    return next(error);
  }
}
