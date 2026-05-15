import { parseMilestoneRequiredDocs } from "../components/student/StudentRequiredDocumentSelect.jsx";

function normalizeDocKey(s) {
  return String(s || "").trim().toLowerCase();
}

export function normalizeTopicSlots(topicRaw) {
  if (!topicRaw) return [];
  if (Array.isArray(topicRaw)) return topicRaw;
  if (topicRaw.id) {
    return [
      {
        team_id: topicRaw.team_id,
        team_name: topicRaw.team_name || "",
        topic: topicRaw,
      },
    ];
  }
  return [];
}

/** Tiến độ = số tài liệu đã nộp / tổng tài liệu cần nộp (theo mốc đã duyệt). */
export function computeProjectDocumentProgress({
  milestones = [],
  submissions = [],
  topicRaw,
}) {
  const slots = normalizeTopicSlots(topicRaw).filter((s) => s.topic?.status === "approved");

  let totalRequired = 0;
  let submittedCount = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  for (const slot of slots) {
    const teamId = slot.team_id;
    const selectedIds = Array.isArray(slot.topic?.selected_milestone_ids)
      ? slot.topic.selected_milestone_ids.map((x) => Number(x)).filter((x) => x > 0)
      : [];

    for (const m of milestones) {
      if (!selectedIds.includes(Number(m.id))) continue;

      const docs = parseMilestoneRequiredDocs(m);
      if (!docs.length) continue;

      const subsForScope = submissions.filter((s) => {
        if (Number(s.team_id) !== Number(teamId)) return false;
        if (Number(s.milestone_id) === Number(m.id)) return true;
        if (!s.milestone_id && s.milestone_name && m.name) {
          return normalizeDocKey(s.milestone_name) === normalizeDocKey(m.name);
        }
        return false;
      });
      const subsByKey = new Map();
      for (const s of subsForScope) {
        subsByKey.set(normalizeDocKey(s.title), s);
      }

      for (const doc of docs) {
        totalRequired += 1;
        const sub = subsByKey.get(normalizeDocKey(doc));
        if (sub) {
          submittedCount += 1;
          if (sub.is_late) lateCount += 1;
          else onTimeCount += 1;
        }
      }
    }
  }

  const missingCount = totalRequired - submittedCount;
  const progressPercent =
    totalRequired > 0 ? Math.round((submittedCount / totalRequired) * 100) : 0;

  return {
    totalRequired,
    submittedCount,
    missingCount,
    onTimeCount,
    lateCount,
    progressPercent,
  };
}
