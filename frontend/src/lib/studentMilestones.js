/** Mốc sinh viên được thấy sau khi đề tài được duyệt. */

export function getTopicSelectedMilestoneIds(topic) {
  if (!topic || topic.status !== "approved") return [];
  if (!Array.isArray(topic.selected_milestone_ids)) return [];
  return topic.selected_milestone_ids.map((x) => Number(x)).filter((x) => x > 0);
}

/**
 * Khi duyệt đề tài, GV chọn vài mốc mẫu thuộc một đợt tốt nghiệp.
 * Sinh viên thấy toàn bộ mốc trong đợt đó (admin thêm/sửa mốc vẫn cập nhật).
 * Nếu không xác định được đợt → chỉ các mốc đã chọn lúc duyệt.
 */
export function getStudentVisibleMilestones(milestoneList, topic) {
  const list = Array.isArray(milestoneList) ? milestoneList : [];
  const selectedIds = getTopicSelectedMilestoneIds(topic);
  if (selectedIds.length === 0) return list;

  const selectedSet = new Set(selectedIds);
  const selectedRows = list.filter((m) => selectedSet.has(Number(m.id)));
  const batchIds = [
    ...new Set(
      selectedRows.map((m) => m.graduation_batch_id).filter((id) => id != null && id !== ""),
    ),
  ];

  if (batchIds.length === 1) {
    const batchId = Number(batchIds[0]);
    return list.filter((m) => Number(m.graduation_batch_id) === batchId);
  }

  return list.filter((m) => selectedSet.has(Number(m.id)));
}

export function getStudentVisibleMilestonesForSlots(milestoneList, topicSlots) {
  const approved = (topicSlots || []).filter((s) => s.topic?.status === "approved");
  if (approved.length === 0) return [];

  const byId = new Map();
  for (const slot of approved) {
    for (const m of getStudentVisibleMilestones(milestoneList, slot.topic)) {
      byId.set(Number(m.id), m);
    }
  }
  return [...byId.values()].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || Number(a.id) - Number(b.id),
  );
}
