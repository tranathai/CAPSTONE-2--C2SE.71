import {
  getTeamManagementData,
  getTeamManagementForMentor,
} from "../models/teamManager.model.js";

// 🔥 STUDENT
export async function getTeamManagement(req, res, next) {
  const { studentName, teamName } = req.query;

  try {
    const currentUserId = req.user?.id || 1; // demo student

    const data = await getTeamManagementData({
      studentName,
      teamName,
      currentUserId,
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("STUDENT ERROR:", err);
    next(err);
  }
}

// 🔥 MENTOR
export async function getTeamManagementMentor(req, res, next) {
  const { studentName, teamName } = req.query;

  try {
    const currentUserId = req.user?.id || 5; // demo mentor

    const data = await getTeamManagementForMentor({
      studentName,
      teamName,
      currentUserId,
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("MENTOR ERROR:", err);
    next(err);
  }
}