import {
  findTeamById,
  findTeamByUserId,
  findTeamsByUserId,
  findTeamMembers,
  findAllTeams,
  findTeamsBySupervisorId,
  createTeam,
  updateTeam,
  deleteTeam,
  findTeamIdByNormalizedName,
  addTeamMember,
  removeTeamMember,
  setTeamLeader,
  userBelongsToTeam,
  findUserRoleNameById,
  countStudentMembersInTeam,
  findStudentOtherTeamInSemester,
  findStudentUserIdsInSemester,
} from "../models/team.model.js";
import { findTopicByTeamId, findGraduationBatchForTopic, hasActiveTopic } from "../models/topic.model.js";
import pool from "../config/db.js";
import { io } from "../server.js";

async function assertStudentCanJoinTeamSemester(userId, teamId) {
  const team = await findTeamById(teamId);
  if (!team) {
    return { ok: false, message: "Không tìm thấy nhóm" };
  }
  const semester = String(team.semester || "").trim();
  if (!semester) {
    return { ok: false, message: "Nhóm chưa có học kỳ / năm học. Vui lòng cập nhật trước khi thêm sinh viên." };
  }
  const conflict = await findStudentOtherTeamInSemester(userId, semester, teamId);
  if (conflict) {
    return {
      ok: false,
      message: `Sinh viên đã thuộc nhóm "${conflict.name}" trong cùng học kỳ năm học.`,
    };
  }
  return { ok: true };
}

export async function getSemesterBusyStudents(req, res, next) {
  try {
    const semester = String(req.query.semester || "").trim();
    if (!semester) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin học kỳ / năm học" });
    }
    const excludeTeamId = req.query.exclude_team_id ? Number(req.query.exclude_team_id) : null;
    const userIds = await findStudentUserIdsInSemester(semester, excludeTeamId || null);
    return res.status(200).json({ success: true, data: userIds });
  } catch (error) {
    next(error);
  }
}

export async function getMyTeamsJoined(req, res, next) {
  try {
    const userId = req.user.id;
    const teams = await findTeamsByUserId(userId);
    const data = await Promise.all(
      teams.map(async (t) => ({
        ...t,
        can_register_topic: !(await hasActiveTopic(t.id)),
      })),
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getMyTeam(req, res, next) {
  try {
    const userId = req.user.id;
    const teamRows = await findTeamsByUserId(userId);
    if (!teamRows.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const data = await Promise.all(
      teamRows.map(async (team) => {
        const members = await findTeamMembers(team.id);
        const topic = await findTopicByTeamId(team.id);
        const graduation_batch = await findGraduationBatchForTopic(topic);
        return { ...team, members, topic, graduation_batch };
      }),
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTeam(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    if (!teamId || teamId <= 0) {
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }

    const team = await findTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhóm" });
    }

    const members = await findTeamMembers(teamId);
    const topic = await findTopicByTeamId(teamId);
    const graduation_batch = await findGraduationBatchForTopic(topic);

    return res.status(200).json({
      success: true,
      data: { ...team, members, topic, graduation_batch },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeams(req, res, next) {
  try {
    const { search } = req.query;
    const teams = await findAllTeams({ search });
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
}

export async function getMySuperviseeTeams(req, res, next) {
  try {
    const supervisorId = req.user.id;
    const teamRows = await findTeamsBySupervisorId(supervisorId);
    const data = await Promise.all(
      teamRows.map(async (team) => {
        const topic = await findTopicByTeamId(team.id);
        const graduation_batch = await findGraduationBatchForTopic(topic);
        return { ...team, topic, graduation_batch };
      }),
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function createNewTeam(req, res, next) {
  try {
    const { name, description, semester, leader_user_id, supervisor_user_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên nhóm không được để trống" });
    }

    const trimmedName = name.trim();
    const dupId = await findTeamIdByNormalizedName(trimmedName, {});
    if (dupId) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm đã tồn tại. Vui lòng chọn tên khác.",
      });
    }

    const teamId = await createTeam({
      name: trimmedName,
      description,
      semester,
      leaderUserId: leader_user_id,
      supervisorUserId: supervisor_user_id,
    });

    if (leader_user_id) {
      const leaderRole = await findUserRoleNameById(Number(leader_user_id));
      if (leaderRole === "student") {
        const semCheck = await assertStudentCanJoinTeamSemester(Number(leader_user_id), teamId);
        if (!semCheck.ok) {
          await deleteTeam(teamId);
          return res.status(400).json({ success: false, message: semCheck.message });
        }
      }
      await addTeamMember(teamId, leader_user_id, true);
    }

    return res.status(201).json({ success: true, message: "Tạo nhóm thành công", data: { id: teamId } });
  } catch (error) {
    next(error);
  }
}

export async function updateExistingTeam(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    const { name, description, semester, leader_user_id, supervisor_user_id } = req.body;

    if (!teamId || teamId <= 0) {
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }

    const existing = await findTeamById(teamId);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhóm" });
    }

    const oldSup =
      existing.supervisor_user_id != null && existing.supervisor_user_id !== ""
        ? Number(existing.supervisor_user_id)
        : null;

    const supervisorFieldSent = Object.prototype.hasOwnProperty.call(req.body, "supervisor_user_id");

    let nameForUpdate;
    if (name !== undefined && name !== null) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: "Tên nhóm không được để trống" });
      }
      const dupId = await findTeamIdByNormalizedName(trimmed, { excludeTeamId: teamId });
      if (dupId) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
      nameForUpdate = trimmed;
    }

    const semesterChanging =
      semester !== undefined &&
      semester !== null &&
      String(semester).trim() !== String(existing.semester || "").trim();

    if (semesterChanging) {
      const newSem = String(semester).trim();
      const members = await findTeamMembers(teamId);
      for (const m of members) {
        const roleName = await findUserRoleNameById(m.id);
        if (roleName !== "student") continue;
        const conflict = await findStudentOtherTeamInSemester(m.id, newSem, teamId);
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Không thể đổi học kỳ: "${m.full_name}" đã thuộc nhóm "${conflict.name}" trong học kỳ này.`,
          });
        }
      }
    }

    await updateTeam(teamId, {
      name: nameForUpdate ?? null,
      description,
      semester,
      leaderUserId: leader_user_id,
      supervisorUserId: supervisor_user_id,
    });

    if (supervisorFieldSent) {
      const updated = await findTeamById(teamId);
      const newSup =
        updated.supervisor_user_id != null && updated.supervisor_user_id !== ""
          ? Number(updated.supervisor_user_id)
          : null;

      if (oldSup !== newSup) {
        if (newSup != null) {
          await pool.query(
            `UPDATE topic_registrations SET supervisor_id = ? WHERE team_id = ? AND status IN ('approved','pending')`,
            [newSup, teamId],
          );
        } else {
          await pool.query(
            `UPDATE topic_registrations SET supervisor_id = NULL WHERE team_id = ? AND status IN ('approved','pending')`,
            [teamId],
          );
        }

        const payload = {
          teamId,
          previousSupervisorId: oldSup,
          newSupervisorId: newSup,
        };

        for (const uid of [oldSup, newSup]) {
          if (uid) {
            io.to(`user:${uid}`).emit("mentor_scope_refresh", payload);
            io.to(`user:${uid}`).emit("topic_pending_refresh", {
              action: "supervisor_reassigned",
              teamId,
            });
          }
        }
      }
    }

    return res.status(200).json({ success: true, message: "Cập nhật nhóm thành công" });
  } catch (error) {
    next(error);
  }
}

export async function removeTeam(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    await deleteTeam(teamId);
    return res.status(200).json({ success: true, message: "Xóa nhóm thành công" });
  } catch (error) {
    next(error);
  }
}

export async function addMember(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    const { user_id, is_leader } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id không hợp lệ" });
    }

    const targetUserId = Number(user_id);
    const roleName = await findUserRoleNameById(targetUserId);
    if (!roleName) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    if (roleName === "student") {
      const alreadyInTeam = await userBelongsToTeam(targetUserId, teamId);
      if (!alreadyInTeam) {
        const studentCount = await countStudentMembersInTeam(teamId);
        if (studentCount >= 5) {
          return res.status(400).json({ success: false, message: "Nhóm chỉ được tối đa 5 sinh viên" });
        }
        const semCheck = await assertStudentCanJoinTeamSemester(targetUserId, teamId);
        if (!semCheck.ok) {
          return res.status(400).json({ success: false, message: semCheck.message });
        }
      }
    }

    await addTeamMember(teamId, targetUserId, is_leader);
    return res.status(201).json({ success: true, message: "Thêm thành viên thành công" });
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id không hợp lệ" });
    }

    await removeTeamMember(teamId, user_id);
    return res.status(200).json({ success: true, message: "Xóa thành viên thành công" });
  } catch (error) {
    next(error);
  }
}

export async function changeTeamLeader(req, res, next) {
  try {
    const teamId = Number(req.params.id);
    const leaderUserId = Number(req.body?.leader_user_id);

    if (!teamId || teamId <= 0) {
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }
    if (!leaderUserId || leaderUserId <= 0) {
      return res.status(400).json({ success: false, message: "leader_user_id không hợp lệ" });
    }

    const team = await findTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Không tìm thấy nhóm" });
    }

    const requesterId = Number(req.user.id);
    if (!(await userBelongsToTeam(requesterId, teamId))) {
      return res.status(403).json({ success: false, message: "Bạn không thuộc nhóm này" });
    }

    if (!(await userBelongsToTeam(leaderUserId, teamId))) {
      return res.status(400).json({ success: false, message: "Thành viên không thuộc nhóm" });
    }

    const roleName = await findUserRoleNameById(leaderUserId);
    if (roleName !== "student") {
      return res.status(400).json({ success: false, message: "Trưởng nhóm phải là sinh viên" });
    }

    await setTeamLeader(teamId, leaderUserId);
    return res.status(200).json({ success: true, message: "Đã cập nhật trưởng nhóm" });
  } catch (error) {
    next(error);
  }
}
