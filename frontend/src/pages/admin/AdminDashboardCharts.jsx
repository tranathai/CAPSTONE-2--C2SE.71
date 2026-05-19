import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import Icon from "../../components/UI/Icon.jsx";
import {
  getFilterRange,
  buildMonthlyNewCounts,
  buildDailyNewCounts,
  countUsersByRoleInRange,
  countActiveInactiveInRange,
  topSemestersByTeams,
} from "./dashboardAnalytics.js";

const palette = {
  student: "#4f7cff",
  supervisor: "#a78bfa",
  admin: "#fb923c",
  team: "#14b8a6",
  milestone: "#f472b6",
  batch: "#818cf8",
  active: "#34d399",
  inactive: "#94a3b8",
  grid: "#e8edf5",
  tick: "#64748b",
  accent: "#312e81",
  cardBg: "linear-gradient(145deg, #ffffff 0%, #f4f7ff 100%)",
  cardBorder: "1px solid rgba(99, 102, 241, 0.12)",
  shadow: "0 4px 24px rgba(49, 46, 129, 0.06)",
};

const tooltipStyle = {
  borderRadius: 12,
  border: "none",
  boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
  background: "rgba(255,255,255,0.96)",
};

function fmtTime(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ChartCard({ title, icon, children, actions }) {
  return (
    <div
      className="card admin-dash-chart-card"
      style={{
        marginBottom: 16,
        background: palette.cardBg,
        border: palette.cardBorder,
        boxShadow: palette.shadow,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div className="card-title" style={{ marginBottom: 0, color: "#0f172a" }}>
          {icon}
          {title}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboardCharts({
  allUsers,
  students,
  supervisors,
  teams,
  milestones,
  lastUpdated,
  onRefresh,
  isRefreshing,
  years,
  yearForCharts,
  filterYear,
  setFilterYear,
  filterMonth,
  setFilterMonth,
}) {
  /** Lọc loại cho biểu đồ "Tổng hoạt động tạo mới" */
  const [totalMetric, setTotalMetric] = useState("all");

  const monthAll = filterMonth === "all" || filterMonth === "";

  const monthlyBars = useMemo(
    () => buildMonthlyNewCounts(yearForCharts, { students, supervisors, teams, milestones }),
    [yearForCharts, students, supervisors, teams, milestones],
  );

  const dailyBars = useMemo(() => {
    if (monthAll) return [];
    return buildDailyNewCounts(yearForCharts, Number(filterMonth), { students, supervisors, teams, milestones });
  }, [yearForCharts, filterMonth, monthAll, students, supervisors, teams, milestones]);

  const barSeries = monthAll ? monthlyBars : dailyBars;

  const range = useMemo(() => getFilterRange(yearForCharts, filterMonth), [yearForCharts, filterMonth]);

  const rolePie = useMemo(() => {
    const { counts } = countUsersByRoleInRange(allUsers || [], range.start, range.end);
    return [
      { name: "Sinh viên", value: counts.student, fill: palette.student },
      { name: "Giảng viên", value: counts.supervisor, fill: palette.supervisor },
      { name: "Quản trị", value: counts.admin, fill: palette.admin },
    ].filter((d) => d.value > 0);
  }, [allUsers, range]);

  const activePie = useMemo(() => {
    const { active, inactive } = countActiveInactiveInRange(allUsers || [], range.start, range.end);
    return [
      { name: "Đang hoạt động", value: active, fill: palette.active },
      { name: "Đã khóa", value: inactive, fill: palette.inactive },
    ].filter((d) => d.value > 0);
  }, [allUsers, range]);

  const semesterBar = useMemo(
    () => topSemestersByTeams(teams || [], range.start, range.end, 10),
    [teams, range],
  );

  const areaSeries = useMemo(
    () =>
      barSeries.map((r) => {
        let tong;
        if (totalMetric === "all") tong = r.sinhVien + r.giangVien + r.nhom + r.moc;
        else tong = r[totalMetric] ?? 0;
        return { ...r, tong };
      }),
    [barSeries, totalMetric],
  );

  const totalMetricLabel =
    totalMetric === "all"
      ? "Tất cả loại"
      : totalMetric === "sinhVien"
        ? "Sinh viên"
        : totalMetric === "giangVien"
          ? "Giảng viên"
          : totalMetric === "nhom"
            ? "Nhóm"
            : "Mốc thời gian";

  return (
    <div className="admin-dash-charts-root">
      <ChartCard
        title="Bộ lọc thống kê"
        icon={<Icon name="BarChart" size={18} color={palette.accent} />}
        actions={(
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#475569" }}>
              Năm
              <select
                className="form-input"
                style={{ width: 100, padding: "6px 10px", fontSize: "0.85rem", borderRadius: 8 }}
                value={yearForCharts}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setFilterYear(Number.isFinite(y) ? y : filterYear);
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#475569" }}>
              Tháng
              <select
                className="form-input"
                style={{ width: 128, padding: "6px 10px", fontSize: "0.85rem", borderRadius: 8 }}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">Cả năm</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isRefreshing}
              onClick={onRefresh}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8 }}
            >
              <Icon name="Refresh" size={14} />
              {isRefreshing ? "Đang tải…" : "Làm mới"}
            </button>
            <span style={{ fontSize: "0.75rem", color: palette.tick }}>{fmtTime(lastUpdated)}</span>
          </div>
        )}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: 16,
        }}
      >
        <ChartCard
          title={monthAll ? "Hoạt động tạo mới theo tháng" : "Hoạt động tạo mới theo ngày"}
          icon={<Icon name="BarChart" size={18} color={palette.accent} />}
        >
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={barSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: palette.tick }}
                  axisLine={{ stroke: palette.grid }}
                  label={monthAll ? undefined : { value: "Ngày trong tháng", position: "insideBottom", offset: -2, fill: palette.tick, fontSize: 11 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: palette.tick }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sinhVien" name="Sinh viên" fill={palette.student} radius={[5, 5, 0, 0]} maxBarSize={26} />
                <Bar dataKey="giangVien" name="Giảng viên" fill={palette.supervisor} radius={[5, 5, 0, 0]} maxBarSize={26} />
                <Bar dataKey="nhom" name="Nhóm" fill={palette.team} radius={[5, 5, 0, 0]} maxBarSize={26} />
                <Bar dataKey="moc" name="Mốc thời gian" fill={palette.milestone} radius={[5, 5, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: 16,
        }}
      >
        <ChartCard
          title="Tổng hoạt động tạo mới"
          icon={<Icon name="BarChart" size={18} color="#0d9488" />}
          actions={(
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: "#475569", margin: 0 }}>
              Loại
              <select
                className="form-input"
                style={{ width: 168, padding: "6px 10px", fontSize: "0.85rem", borderRadius: 8 }}
                value={totalMetric}
                onChange={(e) => setTotalMetric(e.target.value)}
              >
                <option value="all">Tất cả loại</option>
                <option value="sinhVien">Sinh viên</option>
                <option value="giangVien">Giảng viên</option>
                <option value="nhom">Nhóm</option>
                <option value="moc">Mốc thời gian</option>
              </select>
            </label>
          )}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={areaSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: palette.tick }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: palette.tick }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="tong" name={totalMetricLabel} stroke="#4f46e5" fill="url(#adminAreaGrad2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 16,
        }}
      >
        <ChartCard
          title="Người dùng mới theo vai trò"
          icon={<Icon name="People" size={18} color={palette.accent} />}
        >
          <div style={{ width: "100%", height: 280 }}>
            {rolePie.length === 0 ? (
              <p style={{ textAlign: "center", color: palette.tick, padding: 48 }}>Không có người dùng mới trong kỳ này.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
                    {rolePie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Trạng thái tài khoản (người dùng mới trong kỳ)"
          icon={<Icon name="People" size={18} color="#047857" />}
        >
          <div style={{ width: "100%", height: 280 }}>
            {activePie.length === 0 ? (
              <p style={{ textAlign: "center", color: palette.tick, padding: 48 }}>Không có dữ liệu trong kỳ này.</p>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={activePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={86} paddingAngle={2}>
                    {activePie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Nhóm mới theo học kỳ"
          icon={<Icon name="Folder" size={18} color="#b45309" />}
        >
          <div style={{ width: "100%", height: Math.max(260, semesterBar.length * 36) }}>
            {semesterBar.length === 0 ? (
              <p style={{ textAlign: "center", color: palette.tick, padding: 40 }}>Chưa có nhóm trong kỳ này.</p>
            ) : (
              <ResponsiveContainer>
                <BarChart layout="vertical" data={semesterBar} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: palette.tick }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#334155" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Số nhóm" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
