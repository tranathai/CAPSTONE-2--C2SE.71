import { parseMilestoneRequiredDocs } from "../components/student/StudentRequiredDocumentSelect.jsx";
import { normalizeTopicSlots } from "./projectDocumentProgress.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeDocKey(s) {
  return String(s || "").trim().toLowerCase();
}

/**
 * Cảnh báo tài liệu chưa nộp khi còn ≤ warnDays ngày đến hạn mốc (end_date),
 * hoặc đã quá hạn mà vẫn thiếu.
 */
export function buildDocumentDeadlineWarnings({
  milestones = [],
  submissions = [],
  topicRaw,
  warnDays = 3,
}) {
  const warnMs = warnDays * MS_PER_DAY;
  const now = Date.now();
  const warnings = [];
  const slots = normalizeTopicSlots(topicRaw).filter((s) => s.topic?.status === "approved");

  for (const slot of slots) {
    const teamId = slot.team_id;
    const teamName = slot.team_name || "";
    const selectedIds = Array.isArray(slot.topic?.selected_milestone_ids)
      ? slot.topic.selected_milestone_ids.map((x) => Number(x)).filter((x) => x > 0)
      : [];

    for (const m of milestones) {
      if (!selectedIds.includes(Number(m.id))) continue;

      const endMs = new Date(m.end_date).getTime();
      if (!Number.isFinite(endMs)) continue;

      const diff = endMs - now;
      const docs = parseMilestoneRequiredDocs(m);
      if (!docs.length) continue;

      const isUpcomingWindow = diff > 0 && diff <= warnMs;
      const isOverdue = diff < 0;
      if (!isUpcomingWindow && !isOverdue) continue;

      const subsForScope = submissions.filter((s) => {
        if (Number(s.team_id) !== Number(teamId)) return false;
        if (Number(s.milestone_id) === Number(m.id)) return true;
        if (!s.milestone_id && s.milestone_name && m.name) {
          return normalizeDocKey(s.milestone_name) === normalizeDocKey(m.name);
        }
        return false;
      });
      const submittedKeys = new Set(subsForScope.map((s) => normalizeDocKey(s.title)));

      for (const doc of docs) {
        if (submittedKeys.has(normalizeDocKey(doc))) continue;

        const daysLeft = diff > 0 ? Math.max(1, Math.ceil(diff / MS_PER_DAY)) : 0;
        warnings.push({
          id: `deadline-${teamId}-${m.id}-${normalizeDocKey(doc)}`,
          teamId,
          teamName,
          milestoneId: m.id,
          milestoneName: m.name,
          document: doc,
          endDate: m.end_date,
          daysLeft,
          kind: isOverdue ? "overdue" : "upcoming",
        });
      }
    }
  }

  warnings.sort((a, b) => {
    const ka = a.kind === "overdue" ? 0 : 1;
    const kb = b.kind === "overdue" ? 0 : 1;
    if (ka !== kb) return ka - kb;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });

  return warnings;
}

export function formatWarningMessage(w) {
  const endStr = w.endDate ? new Date(w.endDate).toLocaleDateString("vi-VN") : "—";
  const teamSuffix = w.teamName ? ` (nhóm ${w.teamName})` : "";
  if (w.kind === "overdue") {
    return `「${w.document}」— mốc ${w.milestoneName} đã quá hạn (${endStr}) nhưng nhóm chưa nộp${teamSuffix}.`;
  }
  return `「${w.document}」— mốc ${w.milestoneName} còn ${w.daysLeft} ngày đến hạn (${endStr}), nhóm chưa nộp${teamSuffix}.`;
}
