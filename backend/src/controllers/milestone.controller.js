import {
  findAllMilestones,
  findMilestoneById,
  createMilestone,
  updateMilestone,
  applyMilestoneDisplayOrderSwap,
  deleteMilestone,
  findUpcomingMilestones,
  findAllGraduationBatches,
  createGraduationBatch,
  updateGraduationBatch,
  deleteGraduationBatch,
  findDefaultGraduationBatchId,
  findGraduationBatchIdByNormalizedName,
  findGraduationBatchById,
} from "../models/milestone.model.js";

function parseInstant(v) {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = typeof v === "string" ? v.trim() : String(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickDateField(bodyVal, existingVal) {
  if (bodyVal === undefined || bodyVal === null) return existingVal;
  if (typeof bodyVal === "string" && bodyVal.trim() === "") return existingVal;
  return bodyVal;
}

/** @param {{ startRaw: unknown, endRaw: unknown, batch: object|null, siblings: object[], excludeMilestoneId: number|null, mode: 'create'|'update' }} p */
function validateMilestoneWindow({ startRaw, endRaw, batch, siblings, excludeMilestoneId, mode }) {
  const start = parseInstant(startRaw);
  const end = parseInstant(endRaw);
  if (!start || !end) {
    return { ok: false, message: "Ngày bắt đầu và kết thúc phải hợp lệ (đủ ngày giờ, không để trống)." };
  }
  if (start.getTime() >= end.getTime()) {
    return { ok: false, message: "Ngày kết thúc phải sau ngày bắt đầu." };
  }

  if (mode === "create" && batch) {
    const batchEnd = parseInstant(batch.end_date);
    if (batchEnd && Date.now() > batchEnd.getTime()) {
      return { ok: false, message: "Đợt tốt nghiệp đã kết thúc, không thể tạo mốc mới." };
    }
  }

  const bs = parseInstant(batch?.start_date);
  const be = parseInstant(batch?.end_date);
  if (bs && be) {
    if (start.getTime() < bs.getTime() || end.getTime() > be.getTime()) {
      return { ok: false, message: "Thời gian mốc phải nằm trong khung thời gian của đợt tốt nghiệp." };
    }
  } else if (bs) {
    if (start.getTime() < bs.getTime()) {
      return { ok: false, message: "Ngày bắt đầu mốc không được trước ngày bắt đầu đợt." };
    }
  } else if (be) {
    if (end.getTime() > be.getTime()) {
      return { ok: false, message: "Ngày kết thúc mốc không được sau ngày kết thúc đợt." };
    }
  }

  for (const m of siblings) {
    if (excludeMilestoneId != null && Number(m.id) === Number(excludeMilestoneId)) continue;
    const o0 = parseInstant(m.start_date);
    const o1 = parseInstant(m.end_date);
    if (!o0 || !o1) continue;
    if (start < o1 && end > o0) {
      return { ok: false, message: `Mốc trùng khoảng thời gian với mốc "${m.name}".` };
    }
  }

  return { ok: true };
}

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

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Tên milestone không được để trống" });
    }

    const sTrim = typeof start_date === "string" ? start_date.trim() : start_date;
    const eTrim = typeof end_date === "string" ? end_date.trim() : end_date;
    if (!sTrim || !eTrim) {
      return res.status(400).json({ success: false, message: "Ngày bắt đầu và kết thúc không được để trống" });
    }

    const reqDocs = Array.isArray(required_documents)
      ? required_documents.map((x) => String(x).trim()).filter(Boolean)
      : [];
    const resolvedBatchId = graduation_batch_id ? Number(graduation_batch_id) : await findDefaultGraduationBatchId();
    if (!resolvedBatchId) {
      return res.status(400).json({ success: false, message: "Vui lòng tạo Đợt tốt nghiệp trước khi tạo mốc" });
    }

    const batch = await findGraduationBatchById(resolvedBatchId);
    if (!batch) {
      return res.status(400).json({ success: false, message: "Không tìm thấy đợt tốt nghiệp" });
    }

    const siblings = await findAllMilestones({ graduationBatchId: resolvedBatchId });
    const check = validateMilestoneWindow({
      startRaw: start_date,
      endRaw: end_date,
      batch,
      siblings,
      excludeMilestoneId: null,
      mode: "create",
    });
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message });
    }

    const id = await createMilestone({
      name: String(name).trim(),
      description,
      startDate: sTrim,
      endDate: eTrim,
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
    const existing = await findMilestoneById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy milestone" });
    }

    const { name, description, start_date, end_date, deadline_type, display_order, required_documents, graduation_batch_id } = req.body;

    let nameForUpdate = undefined;
    if (name !== undefined && name !== null) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ success: false, message: "Tên milestone không được để trống" });
      }
      nameForUpdate = trimmed;
    }

    const effBatchId =
      graduation_batch_id !== undefined && graduation_batch_id !== null
        ? Number(graduation_batch_id)
        : existing.graduation_batch_id;
    const effStart = pickDateField(start_date, existing.start_date);
    const effEnd = pickDateField(end_date, existing.end_date);

    const batch = effBatchId ? await findGraduationBatchById(effBatchId) : null;
    const siblings = await findAllMilestones({ graduationBatchId: effBatchId || null });
    const check = validateMilestoneWindow({
      startRaw: effStart,
      endRaw: effEnd,
      batch,
      siblings,
      excludeMilestoneId: id,
      mode: "update",
    });
    if (!check.ok) {
      return res.status(400).json({ success: false, message: check.message });
    }

    const reqDocs =
      required_documents !== undefined
        ? Array.isArray(required_documents)
          ? required_documents.map((s) => String(s).trim()).filter(Boolean)
          : []
        : undefined;

    let orderSwap = { swapped: false, swappedWith: null };
    if (display_order !== undefined && display_order !== null) {
      orderSwap = await applyMilestoneDisplayOrderSwap(id, display_order, effBatchId);
    }

    await updateMilestone(id, {
      name: nameForUpdate,
      description,
      startDate: start_date,
      endDate: end_date,
      deadlineType: deadline_type,
      displayOrder:
        display_order !== undefined && display_order !== null ? Number(display_order) : undefined,
      requiredDocuments: reqDocs,
      graduationBatchId: graduation_batch_id !== undefined && graduation_batch_id !== null ? Number(graduation_batch_id) : undefined,
    });

    let message = "Cập nhật milestone thành công";
    if (orderSwap.swapped && orderSwap.swappedWith?.name) {
      message = `Cập nhật thành công. Đã hoán đổi thứ tự hiển thị với mốc "${orderSwap.swappedWith.name}".`;
    }

    return res.status(200).json({
      success: true,
      message,
      data: { swapped_with: orderSwap.swappedWith },
    });
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
    const sTrim = typeof start_date === "string" ? start_date.trim() : start_date != null ? String(start_date).trim() : "";
    const eTrim = typeof end_date === "string" ? end_date.trim() : end_date != null ? String(end_date).trim() : "";
    if (!sTrim || !eTrim) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu và kết thúc đợt tốt nghiệp không được để trống",
      });
    }
    const a = new Date(sTrim);
    const b = new Date(eTrim);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return res.status(400).json({ success: false, message: "Ngày bắt đầu hoặc kết thúc không hợp lệ" });
    }
    if (a.getTime() >= b.getTime()) {
      return res.status(400).json({ success: false, message: "Ngày kết thúc đợt phải sau ngày bắt đầu" });
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
      startDate: sTrim,
      endDate: eTrim,
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
