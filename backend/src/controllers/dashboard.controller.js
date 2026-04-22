import pool from "../config/db.js";

export async function getStudentDashboard(req, res, next) {
  try {
    const [[submissionCount]] = await pool.query(
      `SELECT COUNT(*) AS total
        FROM submissions s
        INNER JOIN team_members tm ON tm.team_id = s.team_id
        WHERE tm.user_id = ?`,
      [req.user.id],
    );
    const [upcoming] = await pool.query(
      `SELECT id, name, end_date
        FROM milestones
        WHERE end_date IS NOT NULL AND end_date >= CURDATE()
        ORDER BY end_date ASC
        LIMIT 5`,
    );
    return res.status(200).json({
      success: true,
      data: {
        submissionCount: submissionCount.total,
        upcomingMilestones: upcoming,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSupervisorDashboard(_req, res, next) {
  try {
    const [[pendingReviews]] = await pool.query(
      "SELECT COUNT(*) AS total FROM submissions WHERE status = 'Pending Review'",
    );
    const [[lateSubmissions]] = await pool.query(
      `SELECT COUNT(*) AS total
      FROM submission_versions sv
      WHERE sv.is_late = 1`,
    );
    return res.status(200).json({
      success: true,
      data: {
        pendingReviews: pendingReviews.total,
        lateSubmissions: lateSubmissions.total,
      },
    });
  } catch (error) {
    return next(error);
  }
}
