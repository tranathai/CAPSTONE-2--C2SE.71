import {
  createTopic,
  findTopicByTeamId,
  hasActiveTopic,
  findPendingTopics,
  updateTopicStatus,
  findApprovedTopicsBySupervisor,
} from "../models/topic.model.js";
import { findTeamByUserId } from "../models/team.model.js";
import { createNotification } from "../models/notification.model.js";
import pool from "../config/db.js";

export async function registerTopic(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description, technologies } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Tên đề tài không được để trống" });
    }

    const team = await findTeamByUserId(userId);
    if (!team) {
      return res.status(400).json({ success: false, message: "Bạn chưa thuộc nhóm nào" });
    }

    const active = await hasActiveTopic(team.id);
    if (active) {
      return res.status(400).json({ success: false, message: "Nhóm đã có đề tài đang chờ duyệt hoặc đã được duyệt" });
    }

    const topicId = await createTopic({
      teamId: team.id,
      title: title.trim(),
      description: description || null,
      technologies: technologies || null,
    });

    const [supervisorRows] = await pool.query(
      `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'supervisor') AND is_active = 1`,
    );
    for (const s of supervisorRows) {
      await createNotification({
        userId: s.id,
        title: "Đề tài mới cần duyệt",
        message: `Nhóm "${team.name}" vừa đăng ký đề tài: "${title.trim()}"`,
        type: "info",
        relatedUrl: "/supervisor/topics",
      });
    }

    return res.status(201).json({ success: true, message: "Đăng ký đề tài thành công, đang chờ duyệt", data: { id: topicId } });
  } catch (error) {
    next(error);
  }
}

export async function getMyTopic(req, res, next) {
  try {
    const userId = req.user.id;
    const team = await findTeamByUserId(userId);

    if (!team) {
      return res.status(200).json({ success: true, data: null });
    }

    const topic = await findTopicByTeamId(team.id);
    return res.status(200).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
}

export async function getPendingTopics(req, res, next) {
  try {
    const topics = await findPendingTopics();
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
}

export async function approveTopic(req, res, next) {
  try {
    const { topicId } = req.params;
    const supervisorId = req.user.id;

    await updateTopicStatus(Number(topicId), {
      status: "approved",
      supervisorId,
      rejectionReason: null,
    });

    const [topicRows] = await pool.query(
      `SELECT tr.team_id, t.name AS team_name FROM topic_registrations tr
       INNER JOIN teams t ON t.id = tr.team_id WHERE tr.id = ?`,
      [topicId],
    );
    if (topicRows[0]) {
      const [memberRows] = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = ?`,
        [topicRows[0].team_id],
      );
      for (const m of memberRows) {
        await createNotification({
          userId: m.user_id,
          title: "Đề tài đã được duyệt",
          message: `Đề tài của nhóm "${topicRows[0].team_name}" đã được giảng viên duyệt`,
          type: "info",
          relatedUrl: "/student/topic",
        });
      }
    }

    return res.status(200).json({ success: true, message: "Duyệt đề tài thành công" });
  } catch (error) {
    next(error);
  }
}

export async function rejectTopic(req, res, next) {
  try {
    const { topicId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Lý do từ chối không được để trống" });
    }

    const [topicRows] = await pool.query(
      `SELECT tr.team_id, t.name AS team_name FROM topic_registrations tr
       INNER JOIN teams t ON t.id = tr.team_id WHERE tr.id = ?`,
      [topicId],
    );

    await updateTopicStatus(Number(topicId), {
      status: "rejected",
      supervisorId: req.user.id,
      rejectionReason: reason.trim(),
    });

    if (topicRows[0]) {
      const [memberRows] = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = ?`,
        [topicRows[0].team_id],
      );
      for (const m of memberRows) {
        await createNotification({
          userId: m.user_id,
          title: "Đề tài bị từ chối",
          message: `Đề tài của nhóm "${topicRows[0].team_name}" đã bị từ chối. Lý do: ${reason.trim()}`,
          type: "info",
          relatedUrl: "/student/topic",
        });
      }
    }

    return res.status(200).json({ success: true, message: "Từ chối đề tài thành công" });
  } catch (error) {
    next(error);
  }
}

export async function getApprovedTopics(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const topics = await findApprovedTopicsBySupervisor(supervisorId);
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
}
