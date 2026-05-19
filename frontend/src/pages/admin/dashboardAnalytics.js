/** Chuẩn hóa mảng từ API (tránh null / object bọc data). */
export function asArray(x) {
  if (x == null) return [];
  if (Array.isArray(x)) return x;
  if (typeof x === "object" && Array.isArray(x.data)) return x.data;
  return [];
}

/** @param {string|Date|number|null|undefined} v */
export function toTime(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return v;
  let s = v;
  if (typeof s === "string") {
    s = s.trim();
    // MySQL DATETIME thường là "YYYY-MM-DD HH:mm:ss" — chuẩn hóa cho Date.parse
    if (/^\d{4}-\d{2}-\d{2} \d/.test(s)) s = s.replace(" ", "T");
  }
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Thời điểm dùng cho biểu đồ (ưu tiên created_at).
 * Fallback start_date / updated_at để dữ liệu cũ hoặc API thiếu created_at vẫn hiện trên chart.
 * @param {Record<string, unknown>} obj
 */
export function chartEntityTime(obj) {
  if (!obj || typeof obj !== "object") return null;
  const chartTs = obj.chart_timestamp ?? obj.chartTimestamp;
  if (chartTs != null && chartTs !== "") return chartTs;
  const c = obj.created_at ?? obj.createdAt;
  if (c != null && c !== "") return c;
  const s = obj.start_date ?? obj.startDate;
  if (s != null && s !== "") return s;
  const u = obj.updated_at ?? obj.updatedAt;
  if (u != null && u !== "") return u;
  const mj = obj.members_joined_earliest ?? obj.membersJoinedEarliest;
  if (mj != null && mj !== "") return mj;
  /** Học kỳ dạng "2024-1" / "2025-2" — dùng năm học để vẫn có mốc trên biểu đồ khi thiếu ngày tạo */
  const semRaw = obj.semester;
  if (semRaw != null && String(semRaw).trim() !== "") {
    const m = String(semRaw).trim().match(/^(\d{4})/);
    if (m) {
      const y = Number(m[1]);
      if (Number.isFinite(y) && y >= 1970 && y <= 2100) return `${y}-06-15T12:00:00`;
    }
  }
  return null;
}

/**
 * Thời điểm gán cho nhóm trên biểu đồ: ưu tiên `created_at` (và alias `create_at` / `createdAt`).
 * Nếu thiếu, dùng `chart_timestamp` từ API (COALESCE created_at, …) hoặc thành viên đầu — tránh lệch
 * so với ô tổng “Nhóm” (đếm mọi bản ghi) khi DB không có ngày tạo.
 */
export function teamCreatedAtForStats(obj) {
  if (!obj || typeof obj !== "object") return null;
  const created = obj.created_at ?? obj.create_at ?? obj.createdAt;
  if (created != null && created !== "") return created;
  const chartTs = obj.chart_timestamp ?? obj.chartTimestamp;
  if (chartTs != null && chartTs !== "") return chartTs;
  const mj = obj.members_joined_earliest ?? obj.membersJoinedEarliest;
  if (mj != null && mj !== "") return mj;
  return null;
}

/** Năm lớn nhất có ít nhất một mốc thời gian hợp lệ (để mặc định bộ lọc năm trùng dữ liệu thật). */
export function inferDefaultChartYear(timestamps, nowYear = new Date().getFullYear()) {
  let maxY = null;
  for (const v of timestamps || []) {
    const t = toTime(v);
    if (t == null) continue;
    const y = new Date(t).getFullYear();
    maxY = maxY === null ? y : Math.max(maxY, y);
  }
  return maxY ?? nowYear;
}

/** Khoảng [start,end] cho cả năm hoặc một tháng (month 1–12). */
export function getFilterRange(year, month) {
  const y = Number(year);
  if (!Number.isFinite(y)) {
    const now = new Date();
    return getFilterRange(now.getFullYear(), null);
  }
  if (month == null || month === "" || month === "all") {
    return {
      start: new Date(y, 0, 1, 0, 0, 0, 0),
      end: new Date(y, 11, 31, 23, 59, 59, 999),
    };
  }
  const m = Number(month);
  if (!Number.isFinite(m) || m < 1 || m > 12) {
    return getFilterRange(y, null);
  }
  return {
    start: new Date(y, m - 1, 1, 0, 0, 0, 0),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  };
}

export function inRange(iso, start, end) {
  const t = toTime(iso);
  if (t == null) return false;
  return t >= start.getTime() && t <= end.getTime();
}

export function yearOptionsFromData(timestamps) {
  const ys = new Set();
  const nowY = new Date().getFullYear();
  const minDefaultYear = 2020;
  const maxDefaultYear = nowY + 1;
  for (let y = minDefaultYear; y <= maxDefaultYear; y += 1) ys.add(y);
  for (const v of timestamps) {
    const t = toTime(v);
    if (t != null) ys.add(new Date(t).getFullYear());
  }
  return [...ys].sort((a, b) => a - b);
}

/** Đếm mới theo từng tháng trong năm `year`. */
export function buildMonthlyNewCounts(year, { students, supervisors, teams, milestones }) {
  const stu = asArray(students);
  const sup = asArray(supervisors);
  const tm = asArray(teams);
  const ms = asArray(milestones);
  const y = Number(year);
  const rows = [];
  for (let m = 1; m <= 12; m += 1) {
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    rows.push({
      key: `${y}-${m}`,
      label: `T${m}`,
      month: m,
      sinhVien: stu.filter((u) => inRange(chartEntityTime(u), start, end)).length,
      giangVien: sup.filter((u) => inRange(chartEntityTime(u), start, end)).length,
      nhom: tm.filter((t) => inRange(teamCreatedAtForStats(t), start, end)).length,
      moc: ms.filter((x) => inRange(chartEntityTime(x), start, end)).length,
    });
  }
  return rows;
}

/** Đếm mới theo ngày trong tháng (khi lọc theo tháng). */
export function buildDailyNewCounts(year, month, { students, supervisors, teams, milestones }) {
  const stu = asArray(students);
  const sup = asArray(supervisors);
  const tm = asArray(teams);
  const ms = asArray(milestones);
  const y = Number(year);
  const m = Number(month);
  const lastDay = new Date(y, m, 0).getDate();
  const rows = [];
  for (let d = 1; d <= lastDay; d += 1) {
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    rows.push({
      key: `${y}-${m}-${d}`,
      label: `${d}`,
      sinhVien: stu.filter((u) => inRange(chartEntityTime(u), dayStart, dayEnd)).length,
      giangVien: sup.filter((u) => inRange(chartEntityTime(u), dayStart, dayEnd)).length,
      nhom: tm.filter((t) => inRange(teamCreatedAtForStats(t), dayStart, dayEnd)).length,
      moc: ms.filter((x) => inRange(chartEntityTime(x), dayStart, dayEnd)).length,
    });
  }
  return rows;
}

export function countBatchesInRange(batches, start, end) {
  return asArray(batches).filter((b) => inRange(chartEntityTime(b), start, end)).length;
}

export function countUsersByRoleInRange(allUsers, start, end) {
  const inR = asArray(allUsers).filter((u) => inRange(chartEntityTime(u), start, end));
  const map = { student: 0, supervisor: 0, admin: 0, other: 0 };
  for (const u of inR) {
    const r = u.role_name;
    if (r === "student") map.student += 1;
    else if (r === "supervisor") map.supervisor += 1;
    else if (r === "admin") map.admin += 1;
    else map.other += 1;
  }
  return { list: inR, counts: map };
}

export function countActiveInactiveInRange(allUsers, start, end) {
  const inR = asArray(allUsers).filter((u) => inRange(chartEntityTime(u), start, end));
  let active = 0;
  let inactive = 0;
  for (const u of inR) {
    if (Number(u.is_active) === 1 || u.is_active === true) active += 1;
    else inactive += 1;
  }
  return { active, inactive, total: inR.length };
}

/** Top học kỳ theo số nhóm (nhóm có created_at trong kỳ). */
export function topSemestersByTeams(teams, start, end, limit = 8) {
  const scoped = asArray(teams).filter((t) => inRange(teamCreatedAtForStats(t), start, end));
  const map = new Map();
  for (const t of scoped) {
    const key = (t.semester && String(t.semester).trim()) || "—";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name: name.length > 24 ? `${name.slice(0, 22)}…` : name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

