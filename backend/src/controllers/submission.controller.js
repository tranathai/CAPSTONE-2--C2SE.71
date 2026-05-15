import fs from "fs";
import {
  findAllSubmissions,
  findSubmissionById,
  findSubmissionVersions,
  createSubmission,
  findStudentSubmissionHistory,
  findSupervisorSubmissions,
  createStudentSubmission,
  addVersionToStudentSubmission,
  updateSubmissionTitle,
  deleteSubmissionVersion,
  findSubmissionsByMilestone,
} from "../models/submission.model.js";
import { findTeamsByUserId, userBelongsToTeam } from "../models/team.model.js";
import { findTopicByTeamId } from "../models/topic.model.js";
import { createNotification } from "../models/notification.model.js";
import pool from "../config/db.js";
import { findMilestoneById } from "../models/milestone.model.js";

function normalizeDocKey(s) {
  return String(s || "").trim().toLowerCase();
}

/** title phải nằm trong required_documents của mốc (khi có cấu hình). */
async function resolveStudentSubmissionTitle({ milestoneId, title }) {
  if (!milestoneId) {
    return { ok: false, message: "Vui lòng chọn mốc thời gian" };
  }
  const milestone = await findMilestoneById(milestoneId);
  if (!milestone) {
    return { ok: false, message: "Không tìm thấy mốc thời gian" };
  }
  const allowed = milestone.required_documents || [];
  if (allowed.length === 0) {
    return {
      ok: false,
      message: "Mốc này chưa có danh sách tài liệu cần nộp. Vui lòng liên hệ quản trị viên.",
    };
  }
  const trimmed = title?.trim();
  if (!trimmed) {
    return { ok: false, message: "Vui lòng chọn tài liệu cần nộp" };
  }
  const match = allowed.find((d) => normalizeDocKey(d) === normalizeDocKey(trimmed));
  if (!match) {
    return { ok: false, message: "Tài liệu không nằm trong danh sách cho phép của mốc này" };
  }
  return { ok: true, title: match };
}

/** Thứ Hai 00:00:00 (local) của tuần chứa `date`. */
function startOfMondayWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatWeekRangeLabelVi(monday, sunday) {
  const o = { day: "2-digit", month: "2-digit" };
  return `${monday.toLocaleDateString("vi-VN", o)}–${sunday.toLocaleDateString("vi-VN", o)}`;
}

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
    const teamRows = await findTeamsByUserId(userId);
    if (!teamRows.length) return res.status(200).json({ success: true, data: [] });
    const merged = [];
    for (const team of teamRows) {
      const topic = await findTopicByTeamId(team.id);
      if (!topic) continue;
      const history = await findStudentSubmissionHistory(team.id, { sinceDate: topic.created_at });
      merged.push(...history);
    }
    merged.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
    return res.status(200).json({ success: true, data: merged });
  } catch (error) {
    next(error);
  }
}

export async function getMySubmissionsByTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const teamId = Number(req.params.teamId);
    if (!teamId || teamId <= 0) {
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }
    const ok = await userBelongsToTeam(userId, teamId);
    if (!ok) {
      return res.status(403).json({ success: false, message: "Bạn không thuộc nhóm này" });
    }
    const topic = await findTopicByTeamId(teamId);
    const history = topic
      ? await findStudentSubmissionHistory(teamId, { sinceDate: topic.created_at })
      : await findStudentSubmissionHistory(teamId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function getSupervisorSubmissions(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const teamId = req.query.team_id ? Number(req.query.team_id) : null;
    if (teamId) {
      const [allowed] = await pool.query(
        `SELECT 1 FROM topic_registrations tr
         WHERE tr.team_id = ? AND tr.status = 'approved' AND tr.supervisor_id = ?
         LIMIT 1`,
        [teamId, supervisorId],
      );
      if (!allowed.length) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem bài nộp của nhóm này" });
      }
    }
    const rows = await findSupervisorSubmissions(supervisorId, { teamId: teamId || null });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const [totalGroups] = await pool.query(
      `SELECT COUNT(DISTINCT t.id) AS count
       FROM teams t
       WHERE t.supervisor_user_id = ?`,
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
    const [pendingTopics] = await pool.query(
      `SELECT COUNT(*) AS count FROM topic_registrations tr
       INNER JOIN teams t ON t.id = tr.team_id
       WHERE tr.status = 'pending' AND t.supervisor_user_id = ?`,
      [supervisorId],
    );
    const [atRiskGroups] = await pool.query(
      `SELECT t.id, t.name, (SELECT COUNT(*) FROM submissions sub INNER JOIN submission_versions sv ON sv.submission_id = sub.id INNER JOIN milestones m ON m.id = sub.milestone_id WHERE sub.team_id = t.id AND sv.is_late = 1) AS late_count, (SELECT COUNT(*) FROM submissions sub INNER JOIN milestones m ON m.id = sub.milestone_id WHERE sub.team_id = t.id AND m.end_date < NOW() AND NOT EXISTS (SELECT 1 FROM submission_versions sv2 WHERE sv2.submission_id = sub.id)) AS missing_count FROM teams t INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' WHERE tr.supervisor_id = ? HAVING late_count > 0 OR missing_count > 0 LIMIT 10`,
      [supervisorId],
    );

    const baseMonday = startOfMondayWeek(new Date());
    const weekly_backlog = [];
    for (let w = 7; w >= 0; w -= 1) {
      const monday = new Date(baseMonday);
      monday.setDate(monday.getDate() - w * 7);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const [reviewedRow] = await pool.query(
        `SELECT COUNT(DISTINCT s.id) AS count FROM submissions s
         INNER JOIN teams t ON t.id = s.team_id
         INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' AND tr.supervisor_id = ?
         WHERE s.status_label = 'Reviewed' AND s.updated_at >= ? AND s.updated_at <= ?`,
        [supervisorId, monday, sunday],
      );
      const [pendingRow] = await pool.query(
        `SELECT COUNT(DISTINCT s.id) AS count FROM submissions s
         INNER JOIN teams t ON t.id = s.team_id
         INNER JOIN topic_registrations tr ON tr.team_id = t.id AND tr.status = 'approved' AND tr.supervisor_id = ?
         INNER JOIN submission_versions sv ON sv.id = (
           SELECT sv2.id FROM submission_versions sv2 WHERE sv2.submission_id = s.id ORDER BY sv2.version_number DESC LIMIT 1
         )
         WHERE s.status_label = 'Pending Review' AND sv.submitted_at >= ? AND sv.submitted_at <= ?`,
        [supervisorId, monday, sunday],
      );

      weekly_backlog.push({
        week_start: monday.toISOString().slice(0, 10),
        label: formatWeekRangeLabelVi(monday, sunday),
        reviewed: Number(reviewedRow[0]?.count ?? 0),
        pending: Number(pendingRow[0]?.count ?? 0),
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        total_groups: totalGroups[0]?.count ?? 0,
        new_submissions: newSubmissions[0]?.count ?? 0,
        late_submissions: lateSubmissions[0]?.count ?? 0,
        pending_topics: pendingTopics[0]?.count ?? 0,
        at_risk_groups: atRiskGroups,
        weekly_backlog,
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

    const titleCheck = await resolveStudentSubmissionTitle({ milestoneId, title });
    if (!titleCheck.ok) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: titleCheck.message });
    }
    const submissionTitle = titleCheck.title;
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

export async function studentUploadNewVersion(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Thiếu file upload" });
    const submissionId = Number(req.body.submission_id);
    const userId = req.user.id;

    if (!submissionId || submissionId <= 0) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: "submission_id không hợp lệ" });
    }

    const result = await addVersionToStudentSubmission({
      submissionId,
      filePath: `/uploads/${req.file.filename}`,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      userId,
    });

    const [topicRows] = await pool.query(
      `SELECT supervisor_id FROM topic_registrations WHERE team_id = ? AND status = 'approved' LIMIT 1`,
      [result.teamId],
    );
    if (topicRows[0]?.supervisor_id) {
      await createNotification({
        userId: topicRows[0].supervisor_id,
        title: "Cập nhật phiên bản bài nộp",
        message: `Nhóm đã nộp phiên bản mới (v${result.versionNumber}): "${result.title}"`,
        type: "feedback",
        relatedUrl: `/mentor/review/${result.submissionId}`,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Đã cập nhật lên phiên bản v${result.versionNumber}`,
      data: result,
    });
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
    const sub = await findSubmissionById(Number(id));
    if (!sub) return res.status(404).json({ success: false, message: "Không tìm thấy bài nộp" });
    const titleCheck = await resolveStudentSubmissionTitle({
      milestoneId: sub.milestone_id,
      title,
    });
    if (!titleCheck.ok) {
      return res.status(400).json({ success: false, message: titleCheck.message });
    }
    await updateSubmissionTitle(Number(id), titleCheck.title, userId);
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