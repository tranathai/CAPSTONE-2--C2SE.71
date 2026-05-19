/** Phân loại cuộc họp theo thời gian thực (không chỉ status DB). */
export function getMeetingTiming(m) {
  if (m.status === "cancelled") {
    return { label: "Đã hủy", badgeClass: "badge-danger", bucket: "past" };
  }
  if (m.status === "completed") {
    return { label: "Hoàn thành", badgeClass: "badge-gray", bucket: "past" };
  }

  const start = new Date(m.scheduled_at);
  const durationMs = (Number(m.duration_minutes) || 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    return { label: "Không rõ", badgeClass: "badge-gray", bucket: "past" };
  }
  if (now < start) {
    return { label: "Sắp tới", badgeClass: "badge-success", bucket: "upcoming" };
  }
  if (now <= end) {
    return { label: "Đang diễn ra", badgeClass: "badge-warning", bucket: "upcoming" };
  }
  return { label: "Đã qua", badgeClass: "badge-gray", bucket: "past" };
}

export function partitionMeetingsByTiming(meetingList) {
  const upcoming = [];
  const past = [];
  for (const m of meetingList) {
    const timing = getMeetingTiming(m);
    const row = { ...m, _timing: timing };
    if (timing.bucket === "upcoming") upcoming.push(row);
    else past.push(row);
  }
  upcoming.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  past.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
  return { upcomingMeetings: upcoming, pastMeetings: past };
}
