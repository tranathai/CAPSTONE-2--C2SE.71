import {
  findMeetingById,
  findMeetingsByUserId,
  findUpcomingMeetings,
  createMeeting,
  addMeetingParticipant,
  updateMeeting,
  deleteMeeting,
  findRequestById,
  findRequestsBySupervisorId,
  createMeetingRequest,
  updateMeetingRequest,
  findRequestsByTeamId,
} from "../models/meeting.model.js";
import { findTeamByUserId } from "../models/team.model.js";
import { createNotification } from "../models/notification.model.js";
import pool from "../config/db.js";

export async function getMeetings(req, res, next) {
  try {
    const meetings = await findMeetingsByUserId(req.user.id);
    return res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
}

export async function getUpcoming(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 5;
    const meetings = await findUpcomingMeetings(req.user.id, limit);
    return res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    next(error);
  }
}

export async function getMeeting(req, res, next) {
  try {
    const meeting = await findMeetingById(Number(req.params.id));
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc họp" });
    }
    return res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { title, description, scheduled_at, duration_minutes, team_id, meeting_url, location } = req.body;
    const hostId = req.user.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề cuộc họp không được để trống" });
    }
    if (!scheduled_at) {
      return res.status(400).json({ success: false, message: "Thời gian không được để trống" });
    }

    const id = await createMeeting({
      title: title.trim(),
      description,
      scheduledAt: scheduled_at,
      durationMinutes: duration_minutes,
      teamId: team_id,
      hostId,
      meetingUrl: meeting_url,
      location,
    });

    // Notify team members
    if (team_id) {
      const [memberRows] = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?`,
        [team_id, hostId],
      );
      for (const m of memberRows) {
        await addMeetingParticipant(id, m.user_id);
        await createNotification({
          userId: m.user_id,
          title: "Cuộc họp mới được tạo",
          message: `Giảng viên tạo cuộc họp: "${title.trim()}" lúc ${scheduled_at}`,
          type: "meeting",
          relatedUrl: `/student/meetings`,
        });
      }
    }

    return res.status(201).json({ success: true, message: "Tạo cuộc họp thành công", data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { title, description, scheduled_at, duration_minutes, meeting_url, location, status } = req.body;

    await updateMeeting(id, { title, description, scheduledAt: scheduled_at, durationMinutes: duration_minutes, meetingUrl: meeting_url, location, status });
    return res.status(200).json({ success: true, message: "Cập nhật cuộc họp thành công" });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    await deleteMeeting(Number(req.params.id));
    return res.status(200).json({ success: true, message: "Xóa cuộc họp thành công" });
  } catch (error) {
    next(error);
  }
}

// Meeting requests (student -> supervisor)
export async function requestMeeting(req, res, next) {
  try {
    const { supervisor_id, title, reason, proposed_at } = req.body;
    const requesterId = req.user.id;

    if (!supervisor_id || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: "supervisor_id và title không được để trống" });
    }
    if (!proposed_at) {
      return res.status(400).json({ success: false, message: "Thời gian đề xuất không được để trống" });
    }

    const team = await findTeamByUserId(requesterId);
    if (!team) {
      return res.status(400).json({ success: false, message: "Bạn chưa thuộc nhóm nào" });
    }

    const id = await createMeetingRequest({
      teamId: team.id,
      requesterId,
      supervisorId: Number(supervisor_id),
      title: title.trim(),
      reason,
      proposedAt: proposed_at,
    });

    await createNotification({
      userId: Number(supervisor_id),
      title: "Yêu cầu họp mới",
      message: `Nhóm "${team.name}" yêu cầu họp: "${title.trim()}"`,
      type: "meeting",
      relatedUrl: "/supervisor/meetings",
    });

    return res.status(201).json({ success: true, message: "Gửi yêu cầu họp thành công", data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function getSupervisorRequests(req, res, next) {
  try {
    const requests = await findRequestsBySupervisorId(req.user.id);
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
}

export async function approveMeetingRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { scheduled_at, duration_minutes, meeting_url, location } = req.body;

    const request = await findRequestById(Number(requestId));
    if (!request) {
      return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại" });
    }

    await updateMeetingRequest(Number(requestId), { status: "approved" });

    // Create meeting from request
    const meetingId = await createMeeting({
      title: request.title,
      description: request.reason,
      scheduledAt: scheduled_at || request.proposed_at,
      durationMinutes: duration_minutes || 60,
      teamId: request.team_id,
      hostId: req.user.id,
      meetingUrl: meeting_url,
      location,
    });

    const [memberRows] = await pool.query(
      `SELECT user_id FROM team_members WHERE team_id = ? AND user_id != ?`,
      [request.team_id, req.user.id],
    );
    for (const m of memberRows) {
      await addMeetingParticipant(meetingId, m.user_id);
    }

    await createNotification({
      userId: request.requester_id,
      title: "Yêu cầu họp được chấp nhận",
      message: `Yêu cầu họp "${request.title}" đã được chấp nhận. Thời gian: ${scheduled_at || request.proposed_at}`,
      type: "meeting",
      relatedUrl: "/student/meetings",
    });

    return res.status(200).json({ success: true, message: "Chấp nhận yêu cầu họp", data: { meeting_id: meetingId } });
  } catch (error) {
    next(error);
  }
}

export async function declineMeetingRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await findRequestById(Number(requestId));
    if (!request) {
      return res.status(404).json({ success: false, message: "Yêu cầu không tồn tại" });
    }

    await updateMeetingRequest(Number(requestId), { status: "declined", responseReason: reason });

    await createNotification({
      userId: request.requester_id,
      title: "Yêu cầu họp bị từ chối",
      message: `Yêu cầu họp "${request.title}" đã bị từ chối${reason ? `: ${reason}` : ""}`,
      type: "meeting",
      relatedUrl: "/student/meetings",
    });

    return res.status(200).json({ success: true, message: "Từ chối yêu cầu họp" });
  } catch (error) {
    next(error);
  }
}

export async function getStudentMeetingRequests(req, res, next) {
  try {
    const team = await findTeamByUserId(req.user.id);
    if (!team) {
      return res.status(200).json({ success: true, data: [] });
    }
    const requests = await findRequestsByTeamId(team.id);
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
}
