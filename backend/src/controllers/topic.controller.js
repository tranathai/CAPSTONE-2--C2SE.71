import {
  createTopic,
  findTopicByTeamId,
  hasActiveTopic,
  findPendingTopics,
  updateTopicStatus,
  findApprovedTopicsBySupervisor,
  getTopicRegistrationEligibility,
  deleteActiveTopicsByTeam,
} from "../models/topic.model.js";
import { findTeamByUserId, findTeamById, userBelongsToTeam } from "../models/team.model.js";
import { createNotification } from "../models/notification.model.js";
import pool from "../config/db.js";
import { io } from "../server.js";

export async function registerTopic(req, res, next) {
  try {
    const userId = req.user.id;
    const { title, description, technologies, team_id } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Tên đề tài không được để trống" });
    }

    let team;
    if (team_id != null && team_id !== "") {
      const tid = Number(team_id);
      if (!tid || tid <= 0) {
        return res.status(400).json({ success: false, message: "Nhóm không hợp lệ" });
      }
      const ok = await userBelongsToTeam(userId, tid);
      if (!ok) {
        return res.status(403).json({ success: false, message: "Bạn không thuộc nhóm đã chọn" });
      }
      team = await findTeamById(tid);
      if (!team) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhóm" });
      }
    } else {
      team = await findTeamByUserId(userId);
    }

    if (!team) {
      return res.status(400).json({ success: false, message: "Bạn chưa thuộc nhóm nào" });
    }

    const active = await hasActiveTopic(team.id);
    if (active) {
      const { reason } = await getTopicRegistrationEligibility(team.id);
      return res.status(400).json({
        success: false,
        message: reason || "Nhóm chưa thể đăng ký đề tài mới lúc này.",
      });
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
      io.to(`user:${s.id}`).emit("topic_pending_refresh", {
        topicId,
        teamName: team.name,
        title: title.trim(),
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
    const elig = await getTopicRegistrationEligibility(team.id);
    let selectedMilestoneIds = [];
    if (topic?.selected_milestone_ids) {
      try {
        const parsed = JSON.parse(topic.selected_milestone_ids);
        if (Array.isArray(parsed)) selectedMilestoneIds = parsed.map((x) => Number(x)).filter((x) => x > 0);
      } catch {
        selectedMilestoneIds = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: topic
        ? {
            ...topic,
            selected_milestone_ids: selectedMilestoneIds,
            can_register_new_topic: elig.canRegister,
            registration_block_reason: elig.reason,
          }
        : null,
    });
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
    const idNum = Number(topicId);
    const selectedIds = Array.isArray(req.body?.milestone_ids)
      ? [...new Set(req.body.milestone_ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))]
      : [];
    if (!selectedIds.length) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất 1 mốc thời gian khi duyệt đề tài" });
    }
    const [milestoneRows] = await pool.query(`SELECT id FROM milestones WHERE id IN (?)`, [selectedIds]);
    if (milestoneRows.length !== selectedIds.length) {
      return res.status(400).json({ success: false, message: "Mốc thời gian đã chọn không hợp lệ" });
    }
    const selectedJson = JSON.stringify(selectedIds);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [topicTeamRows] = await connection.query(`SELECT team_id FROM topic_registrations WHERE id = ?`, [idNum]);
      const teamIdForTopic = topicTeamRows[0]?.team_id;
      if (teamIdForTopic) {
        await connection.query(
          `UPDATE topic_registrations SET status = 'completed', rejection_reason = NULL, updated_at = NOW()
           WHERE team_id = ? AND status = 'approved' AND id <> ?`,
          [teamIdForTopic, idNum],
        );
      }
      await connection.query(
        `UPDATE topic_registrations SET status = ?, supervisor_id = ?, rejection_reason = ?, selected_milestone_ids = ? WHERE id = ?`,
        ["approved", supervisorId, null, selectedJson, idNum],
      );
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

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

    const [supRows] = await pool.query(
      `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'supervisor') AND is_active = 1`,
    );
    for (const s of supRows) {
      io.to(`user:${s.id}`).emit("topic_pending_refresh", { topicId: Number(topicId), action: "resolved" });
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

    const [supRows2] = await pool.query(
      `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'supervisor') AND is_active = 1`,
    );
    for (const s of supRows2) {
      io.to(`user:${s.id}`).emit("topic_pending_refresh", { topicId: Number(topicId), action: "resolved" });
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

export async function deleteMyTopic(req, res, next) {
  try {
    const userId = req.user.id;
    const team = await findTeamByUserId(userId);
    if (!team) {
      return res.status(400).json({ success: false, message: "Bạn chưa thuộc nhóm nào" });
    }

    const topic = await findTopicByTeamId(team.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: "Không có đề tài để xóa" });
    }

    const deletedIds = await deleteActiveTopicsByTeam(team.id);
    if (!deletedIds.length) {
      return res.status(400).json({ success: false, message: "Không thể xóa đề tài này" });
    }

    const [supRows] = await pool.query(
      `SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'supervisor') AND is_active = 1`,
    );
    for (const s of supRows) {
      io.to(`user:${s.id}`).emit("topic_pending_refresh", { topicId: Number(topic.id), action: "removed" });
    }

    return res.status(200).json({
      success: true,
      message: `Đã xóa ${deletedIds.length} đề tài đang hoạt động của nhóm`,
    });
  } catch (error) {
    next(error);
  }
}
