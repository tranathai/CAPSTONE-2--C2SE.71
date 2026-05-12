import {
  findAllMilestones,
  findMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  findUpcomingMilestones,
  findAllGraduationBatches,
  createGraduationBatch,
  updateGraduationBatch,
  deleteGraduationBatch,
  findDefaultGraduationBatchId,
  findGraduationBatchIdByNormalizedName,
} from "../models/milestone.model.js";

export async function getMilestones(req, res, next) {
  try {
    const batchId = req.query.batch_id ? Number(req.query.batch_id) : null;
    const milestones = await findAllMilestones({ graduationBatchId: batchId || null });
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
    const { name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên milestone không được để trống" });
    }
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Ngày bắt đầu và kết thúc không được để trống" });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    const reqDocs = Array.isArray(required_documents)
      ? required_documents.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const resolvedBatchId = graduation_batch_id ? Number(graduation_batch_id) : await findDefaultGraduationBatchId();
    if (!resolvedBatchId) {
      return res.status(400).json({ success: false, message: "Vui lòng tạo Đợt tốt nghiệp trước khi tạo mốc" });
    }

    const id = await createMilestone({
      name: name.trim(),
      description,
      startDate: start_date,
      endDate: end_date,
      deadlineType: deadline_type,
      displayOrder: display_order,
      requiredDocuments: reqDocs,
      graduationBatchId: resolvedBatchId,
    });
    return res.status(201).json({ success: true, message: "Tạo milestone thành công", data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id } = req.body;

    const reqDocs =
      required_documents !== undefined
        ? Array.isArray(required_documents)
          ? required_documents.map((s) => String(s).trim()).filter(Boolean)
          : []
        : undefined;

    await updateMilestone(id, {
      name,
      description,
      startDate: start_date,
      endDate: end_date,
      deadlineType: deadline_type,
      displayOrder: display_order,
      requiredDocuments: reqDocs,
      graduationBatchId: graduation_batch_id ? Number(graduation_batch_id) : undefined,
    });
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

export async function getGraduationBatches(req, res, next) {
  try {
    const rows = await findAllGraduationBatches();
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

export async function createBatch(req, res, next) {
  try {
    const { name, description, start_date, end_date } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên Đợt tốt nghiệp không được để trống" });
    }
    const trimmedName = name.trim();
    const dupId = await findGraduationBatchIdByNormalizedName(trimmedName, {});
    if (dupId) {
      return res.status(400).json({
        success: false,
        message: "Tên đợt tốt nghiệp đã tồn tại. Vui lòng chọn tên khác.",
      });
    }
    const id = await createGraduationBatch({
      name: trimmedName,
      description,
      startDate: start_date || null,
      endDate: end_date || null,
    });
    return res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function updateBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, start_date, end_date } = req.body;

    let nameForUpdate = null;
    if (name !== undefined && name !== null) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: "Tên Đợt tốt nghiệp không được để trống" });
      }
      const dupId = await findGraduationBatchIdByNormalizedName(trimmed, { excludeId: id });
      if (dupId) {
        return res.status(400).json({
          success: false,
          message: "Tên đợt tốt nghiệp đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
      nameForUpdate = trimmed;
    }

    await updateGraduationBatch(id, {
      name: nameForUpdate,
      description,
      startDate: start_date || null,
      endDate: end_date || null,
    });
    return res.status(200).json({ success: true, message: "Cập nhật Đợt tốt nghiệp thành công" });
  } catch (error) {
    next(error);
  }
}

export async function removeBatch(req, res, next) {
  try {
    const id = Number(req.params.id);
    await deleteGraduationBatch(id);
    return res.status(200).json({ success: true, message: "Xóa Đợt tốt nghiệp thành công" });
  } catch (error) {
    next(error);
  }
}
