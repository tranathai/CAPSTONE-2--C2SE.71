import fs from "fs";
import {
  findAllSubmissions,
  findSubmissionById,
  findSubmissionVersions,
  createSubmission,
  findStudentSubmissionHistory,
  findSupervisorSubmissions,
  createStudentSubmission,
  updateSubmissionTitle,
  deleteSubmissionVersion,
  findSubmissionsByMilestone,
} from "../models/submission.model.js";
import { findTeamByUserId } from "../models/team.model.js";
import { createNotification } from "../models/notification.model.js";
import pool from "../config/db.js";

export async function listSubmissions(req, res, next) {
  try {
    const { team_id, milestone_id } = req.query;
    const rows = await findAllSubmissions({ 
      teamId: team_id ? Number(team_id) : null, 
      milestoneId: milestone_id ? Number(milestone_id) : null 
    });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function getSubmission(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ success: false, message: "submission id không hợp lệ" });
    }

    const submission = await findSubmissionById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Không tìm thấy submission" });
    }

    const versions = await findSubmissionVersions(id);
    return res.status(200).json({ success: true, data: { ...submission, versions } });
  } catch (error) {
    next(error);
  }
}

export async function uploadSubmission(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Thiếu file upload" });
    }

    const { team_id, milestone_id, title } = req.body;
    const teamId = Number(team_id);
    const milestoneId = milestone_id ? Number(milestone_id) : null;

    if (!teamId || teamId <= 0) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }

    const submissionTitle = (title && title.trim()) || req.file.originalname || "Submission";

    const result = await createSubmission({
      teamId,
      milestoneId,
      title: submissionTitle,
      filePath: `/uploads/${req.file.filename}`,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
    });

    const [topicRows] = await pool.query(
      `SELECT supervisor_id FROM topic_registrations WHERE team_id = ? AND status = 'approved' LIMIT 1`,
      [teamId],
    );
    if (topicRows[0]?.supervisor_id) {
      await createNotification({
        userId: topicRows[0].supervisor_id,
        title: "Nộp bài mới",
        message: `Nhóm đã nộp bài: "${submissionTitle}"`,
        type: "feedback",
        relatedUrl: `/mentor/review/${result.submissionId}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Upload thành công",
      data: result,
    });
  } catch (error) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
}

export async function getMySubmissions(req, res, next) {
  try {
    const userId = req.user.id;
    const team = await findTeamByUserId(userId);
    if (!team) return res.status(200).json({ success: true, data: [] });
    const history = await findStudentSubmissionHistory(team.id);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function getMySubmissionsByTeam(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const history = await findStudentSubmissionHistory(teamId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function getSupervisorSubmissions(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const submissions = await findSupervisorSubmissions(supervisorId);
    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const [totalGroups] = await pool.query(
      `SELECT COUNT(DISTINCT t.id) AS count FROM teams t INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' WHERE tr.supervisor_id = ?`,
      [supervisorId],
    );
    const [newSubmissions] = await pool.query(
      `SELECT COUNT(DISTINCT s.id) AS count FROM submissions s INNER JOIN teams t ON t.id = s.team_id INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' WHERE tr.supervisor_id = ? AND DATEDIFF(NOW(), s.submitted_at) <= 7`,
      [supervisorId],
    );
    const [lateSubmissions] = await pool.query(
      `SELECT COUNT(DISTINCT s.id) AS count FROM submissions s INNER JOIN teams t ON t.id = s.team_id INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' INNER JOIN submission_versions sv ON sv.id = (SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id ORDER BY sv2.version_number DESC LIMIT 1) WHERE tr.supervisor_id = ? AND sv.is_late = 1`,
      [supervisorId],
    );
    const [pendingTopics] = await pool.query(`SELECT COUNT(*) AS count FROM topic_registrations WHERE status = 'pending'`);
    const [atRiskGroups] = await pool.query(
      `SELECT t.id, t.name, (SELECT COUNT(*) FROM submissions sub INNER JOIN submission_versions sv ON sv.submission_id = sub.id INNER JOIN milestones m ON m.id = sub.milestone_id WHERE sub.team_id = t.id AND sv.is_late = 1) AS late_count, (SELECT COUNT(*) FROM submissions sub INNER JOIN milestones m ON m.id = sub.milestone_id WHERE sub.team_id = t.id AND m.end_date < NOW() AND NOT EXISTS (SELECT 1 FROM submission_versions sv2 WHERE sv2.submission_id = sub.id)) AS missing_count FROM teams t INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' WHERE tr.supervisor_id = ? HAVING late_count > 0 OR missing_count > 0 LIMIT 10`,
      [supervisorId],
    );

    return res.status(200).json({
      success: true,
      data: {
        total_groups: totalGroups[0]?.count ?? 0,
        new_submissions: newSubmissions[0]?.count ?? 0,
        late_submissions: lateSubmissions[0]?.count ?? 0,
        pending_topics: pendingTopics[0]?.count ?? 0,
        at_risk_groups: atRiskGroups,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function studentUploadSubmission(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Thiếu file upload" });
    const { team_id, milestone_id, title } = req.body;
    const teamId = Number(team_id);
    const milestoneId = milestone_id ? Number(milestone_id) : null;
    const userId = req.user.id;

    if (!teamId || teamId <= 0) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }

    const submissionTitle = (title && title.trim()) || req.file.originalname || "Submission";
    const result = await createStudentSubmission({
      teamId, milestoneId, title: submissionTitle,
      filePath: `/uploads/${req.file.filename}`,
      originalFilename: req.file.originalname,
      fileSize: req.file.size, userId,
    });

    const [topicRows] = await pool.query(
      `SELECT supervisor_id FROM topic_registrations WHERE team_id = ? AND status = 'approved' LIMIT 1`,
      [teamId],
    );
    if (topicRows[0]?.supervisor_id) {
      await createNotification({
        userId: topicRows[0].supervisor_id,
        title: "Nộp bài mới",
        message: `Nhóm đã nộp bài: "${submissionTitle}"`,
        type: "feedback",
        relatedUrl: `/mentor/review/${result.submissionId}`,
      });
    }

    return res.status(201).json({ success: true, message: "Upload thành công", data: result });
  } catch (error) {
    if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
    next(error);
  }
}

export async function updateSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: "Tiêu đề không được để trống" });
    await updateSubmissionTitle(Number(id), title.trim(), userId);
    return res.status(200).json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
}

export async function deleteVersion(req, res, next) {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;
    await deleteSubmissionVersion(Number(versionId), userId);
    return res.status(200).json({ success: true, message: "Xóa phiên bản thành công" });
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionsByMilestone(req, res, next) {
  try {
    const { teamId, milestoneId } = req.params;
    const submissions = await findSubmissionsByMilestone(Number(teamId), Number(milestoneId));
    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
}