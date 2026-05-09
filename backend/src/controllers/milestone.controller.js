import {
  findAllMilestones,
  findMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  findUpcomingMilestones,
} from "../models/milestone.model.js";

export async function getMilestones(req, res, next) {
  try {
    const milestones = await findAllMilestones();
    return res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
}

export async function getMilestone(req, res, next) {
  try {
    const id = Number(req.params.id);
    const milestone = await findMilestoneById(id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: "Không tìm thấy milestone" });
    }
    return res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
}

export async function getUpcomingMilestones(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 5;
    const milestones = await findUpcomingMilestones(limit);
    return res.status(200).json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { name, description, start_date, end_date, deadline_type, display_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên milestone không được để trống" });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Ngày bắt đầu và kết thúc không được để trống" });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    const id = await createMilestone({ name: name.trim(), description, startDate: start_date, endDate: end_date, deadlineType: deadline_type, displayOrder: display_order });
    return res.status(201).json({ success: true, message: "Tạo milestone thành công", data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, start_date, end_date, deadline_type, display_order } = req.body;

    await updateMilestone(id, { name, description, startDate: start_date, endDate: end_date, deadlineType: deadline_type, displayOrder: display_order });
    return res.status(200).json({ success: true, message: "Cập nhật milestone thành công" });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    await deleteMilestone(id);
    return res.status(200).json({ success: true, message: "Xóa milestone thành công" });
  } catch (error) {
    next(error);
  }
}
