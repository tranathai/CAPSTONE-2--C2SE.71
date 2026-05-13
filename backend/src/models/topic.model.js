import pool from "../config/db.js";
import { findFinalMilestone } from "./milestone.model.js";

export async function findTopicByTeamId(teamId) {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.team_id, tr.title, tr.description, tr.technologies, tr.status,
            tr.supervisor_id, tr.rejection_reason, tr.selected_milestone_ids, tr.created_at, tr.updated_at,
            u.full_name AS supervisor_name,
            t.name AS team_name
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     LEFT JOIN users u ON u.id = tr.supervisor_id
     WHERE tr.team_id = ? AND tr.status <> 'completed'
     ORDER BY (tr.status = 'pending') DESC, tr.id DESC
     LIMIT 1`,
    [teamId],
  );
  return rows[0] || null;
}

/** Đề tài chờ duyệt của các nhóm mà GV được phân công (teams.supervisor_user_id). */
export async function findPendingTopicsForSupervisor(supervisorId) {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.title, tr.description, tr.technologies, tr.created_at,
            t.id AS team_id, t.name AS team_name,
            (SELECT u.full_name FROM team_members tm INNER JOIN users u ON u.id = tm.user_id
             WHERE tm.team_id = t.id AND tm.is_leader = 1 LIMIT 1) AS leader_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     WHERE tr.status = 'pending' AND t.supervisor_user_id = ?
     ORDER BY tr.created_at ASC`,
    [supervisorId],
  );
  return rows;
}

export async function createTopic({ teamId, title, description, technologies }) {
  const [result] = await pool.query(
    `INSERT INTO topic_registrations (team_id, title, description, technologies) VALUES (?, ?, ?, ?)`,
    [teamId, title, description || null, technologies || null],
  );
  return result.insertId;
}

export async function deleteTopicByIdForTeam(topicId, teamId) {
  const [result] = await pool.query(
    `DELETE FROM topic_registrations WHERE id = ? AND team_id = ? LIMIT 1`,
    [topicId, teamId],
  );
  return result.affectedRows > 0;
}

export async function deleteActiveTopicsByTeam(teamId) {
  const [rows] = await pool.query(
    `SELECT id FROM topic_registrations WHERE team_id = ? AND status IN ('pending','approved','rejected')`,
    [teamId],
  );
  if (!rows.length) return [];
  await pool.query(
    `DELETE FROM topic_registrations WHERE team_id = ? AND status IN ('pending','approved','rejected')`,
    [teamId],
  );
  return rows.map((r) => Number(r.id));
}

export async function updateTopicStatus(id, { status, supervisorId, rejectionReason }) {
  await pool.query(
    `UPDATE topic_registrations SET status = ?, supervisor_id = ?, rejection_reason = ?, selected_milestone_ids = COALESCE(?, selected_milestone_ids) WHERE id = ?`,
    [status, supervisorId || null, rejectionReason || null, null, id],
  );
}

export async function findApprovedTopicsBySupervisor(supervisorId) {
  const [rows] = await pool.query(
    `SELECT tr.id, tr.title, tr.description, tr.technologies, tr.created_at,
            t.id AS team_id, t.name AS team_name,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count
     FROM topic_registrations tr
     INNER JOIN teams t ON t.id = tr.team_id
     WHERE tr.supervisor_id = ? AND tr.status = 'approved'
     ORDER BY tr.id DESC`,
    [supervisorId],
  );
  return rows;
}

export async function findLatestApprovedTopicForTeam(teamId) {
  const [rows] = await pool.query(
    `SELECT id, created_at FROM topic_registrations
     WHERE team_id = ? AND status = 'approved' ORDER BY id DESC LIMIT 1`,
    [teamId],
  );
  return rows[0] || null;
}

/** Đủ điều kiện đăng ký đề tài mới: đã qua hạn mốc Final (admin) + bài Final đã Reviewed trong chu kỳ đề tài hiện tại. */
export async function teamEligibleForNewTopicAfterCompletion(teamId) {
  const currentApproved = await findLatestApprovedTopicForTeam(teamId);
  if (!currentApproved) return false;

  const finalMs = await findFinalMilestone();
  if (!finalMs?.id) return false;

  const deadline = new Date(finalMs.end_date);
  if (Number.isNaN(deadline.getTime()) || deadline >= new Date()) return false;

  const [rows] = await pool.query(
    `SELECT 1 FROM submissions s
     WHERE s.team_id = ? AND s.milestone_id = ? AND s.status_label = 'Reviewed'
       AND s.submitted_at >= ?
     LIMIT 1`,
    [teamId, finalMs.id, currentApproved.created_at],
  );
  return rows.length > 0;
}

function formatDt(v) {
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString("vi-VN");
  } catch {
    return String(v);
  }
}

export async function getTopicRegistrationEligibility(teamId) {
  const [pend] = await pool.query(
    `SELECT 1 FROM topic_registrations WHERE team_id = ? AND status = 'pending' LIMIT 1`,
    [teamId],
  );
  if (pend.length) {
    return { canRegister: false, reason: "Đề tài đang chờ giảng viên duyệt." };
  }

  const approved = await findLatestApprovedTopicForTeam(teamId);
  if (!approved) {
    return { canRegister: true, reason: null };
  }

  const eligible = await teamEligibleForNewTopicAfterCompletion(teamId);
  if (eligible) {
    return { canRegister: true, reason: null };
  }

  const finalMs = await findFinalMilestone();
  if (!finalMs) {
    return {
      canRegister: false,
      reason: "Admin chưa cấu hình mốc (Final). Liên hệ quản trị viên.",
    };
  }

  if (new Date(finalMs.end_date) >= new Date()) {
    return {
      canRegister: false,
      reason: `Sau ${formatDt(finalMs.end_date)} (hạn mốc Final do admin đặt) và khi bài Final được đánh giá (Reviewed), nhóm có thể đăng ký đề tài mới.`,
    };
  }

  const currentApproved = approved;
  const [submitted] = await pool.query(
    `SELECT 1 FROM submissions s
     WHERE s.team_id = ? AND s.milestone_id = ? AND s.submitted_at >= ?
     LIMIT 1`,
    [teamId, finalMs.id, currentApproved.created_at],
  );
  if (!submitted.length) {
    return {
      canRegister: false,
      reason:
        "Cần nộp bài ở mốc Final (sau khi đề tài được duyệt) trước khi đăng ký đề tài mới.",
    };
  }

  return {
    canRegister: false,
    reason: "Bài mốc Final cần được giảng viên phản hồi (trạng thái Reviewed) trước khi đăng ký đề tài mới.",
  };
}

export async function hasActiveTopic(teamId) {
  const { canRegister } = await getTopicRegistrationEligibility(teamId);
  return !canRegister;
}
