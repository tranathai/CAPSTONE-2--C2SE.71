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
  userBelongsToTeam,
  findUserRoleNameById,
  countStudentMembersInTeam,
} from "../models/team.model.js";
import { findTopicByTeamId, hasActiveTopic } from "../models/topic.model.js";

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
    const team = await findTeamByUserId(userId);

    if (!team) {
      return res.status(200).json({ success: true, data: null });
    }

    const members = await findTeamMembers(team.id);
    const topic = await findTopicByTeamId(team.id);

    return res.status(200).json({
      success: true,
      data: { ...team, members, topic },
    });
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

    return res.status(200).json({
      success: true,
      data: { ...team, members, topic },
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
    const teams = await findTeamsBySupervisorId(supervisorId);
    return res.status(200).json({ success: true, data: teams });
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

    await updateTeam(teamId, {
      name: nameForUpdate ?? null,
      description,
      semester,
      leaderUserId: leader_user_id,
      supervisorUserId: supervisor_user_id,
    });
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
