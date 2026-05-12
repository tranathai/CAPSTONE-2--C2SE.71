import { useState, useEffect, useMemo, useCallback } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { users, teams, milestones } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminDashboardCharts from "./AdminDashboardCharts.jsx";
import {
  yearOptionsFromData,
  buildMonthlyNewCounts,
  chartEntityTime,
  teamCreatedAtForStats,
  toTime,
  asArray,
} from "./dashboardAnalytics.js";

const REFRESH_MS = 45_000;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [milestoneList, setMilestoneList] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState("all");

  const loadData = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) setIsRefreshing(true);
    try {
      const [uAll, tl, ml, bt] = await Promise.all([
        users.list(),
        teams.list(),
        milestones.list(),
        milestones.batchList(),
      ]);
      setAllUsers(Array.isArray(uAll) ? uAll : []);
      setTeamList(Array.isArray(tl) ? tl : []);
      setMilestoneList(Array.isArray(ml) ? ml : []);
      setBatches(Array.isArray(bt) ? bt : []);
      setLastUpdated(new Date());
    } catch {
      /* giữ dữ liệu cũ nếu lỗi mạng */
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData({ silent: false }).finally(() => {});
  }, [loadData]);

  useEffect(() => {
    const id = setInterval(() => loadData({ silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [loadData]);

  const students = useMemo(
    () => allUsers.filter((u) => u.role_name === "student"),
    [allUsers],
  );
  const supervisors = useMemo(
    () => allUsers.filter((u) => u.role_name === "supervisor"),
    [allUsers],
  );

  const allTimes = useMemo(() => {
    const out = [];
    for (const u of allUsers || []) out.push(chartEntityTime(u));
    for (const t of teamList || []) out.push(teamCreatedAtForStats(t));
    for (const m of milestoneList || []) out.push(chartEntityTime(m));
    for (const b of batches || []) out.push(chartEntityTime(b));
    return out;
  }, [allUsers, teamList, milestoneList, batches]);

  const years = useMemo(() => yearOptionsFromData(allTimes), [allTimes]);

  useEffect(() => {
    const yrs = yearOptionsFromData(allTimes);
    if (yrs.length === 0) return;
    if (!allTimes.some((v) => toTime(v) != null)) return;
    const buckets = {
      students: asArray(students),
      supervisors: asArray(supervisors),
      teams: asArray(teamList),
      milestones: asArray(milestoneList),
    };
    const activitySumYear = (y) =>
      buildMonthlyNewCounts(y, buckets).reduce((s, r) => s + r.sinhVien + r.giangVien + r.nhom + r.moc, 0);
    setFilterYear((cur) => {
      const safeCur = yrs.includes(cur) ? cur : yrs[yrs.length - 1];
      let bestY = safeCur;
      let bestSum = activitySumYear(safeCur);
      for (const y of yrs) {
        const s = activitySumYear(y);
        if (s > bestSum) {
          bestSum = s;
          bestY = y;
        }
      }
      if (bestSum > 0 && bestY !== cur) return bestY;
      if (safeCur !== cur) return safeCur;
      return cur;
    });
  }, [allTimes, students, supervisors, teamList, milestoneList]);

  const yearForCharts = useMemo(() => {
    const fallback = years.length ? years[years.length - 1] : new Date().getFullYear();
    return years.includes(filterYear) ? filterYear : fallback;
  }, [years, filterYear]);

  const statsTotal = useMemo(
    () => ({
      students: students.length,
      supervisors: supervisors.length,
      teams: teamList.length,
      milestones: milestoneList.length,
    }),
    [students, supervisors, teamList, milestoneList],
  );

  if (loading && allUsers.length === 0 && teamList.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Xin chào, {user?.full_name}!</h1>
        <p>Quản trị hệ thống MentorAI Grad</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155", marginBottom: 10 }}>Tổng toàn hệ thống</div>
        <div className="stats-grid admin-dash-stat-grid">
          <div className="stat-card admin-dash-stat-card admin-dash-stat-card--students">
            <div className="stat-label"><Icon name="User" size={14} /> Sinh viên</div>
            <div className="stat-value">{statsTotal.students}</div>
          </div>
          <div className="stat-card admin-dash-stat-card admin-dash-stat-card--supervisors">
            <div className="stat-label"><Icon name="User" size={14} /> Giảng viên</div>
            <div className="stat-value">{statsTotal.supervisors}</div>
          </div>
          <div className="stat-card admin-dash-stat-card admin-dash-stat-card--teams">
            <div className="stat-label"><Icon name="Folder" size={14} /> Nhóm</div>
            <div className="stat-value">{statsTotal.teams}</div>
          </div>
          <div className="stat-card admin-dash-stat-card admin-dash-stat-card--milestones">
            <div className="stat-label"><Icon name="Flag" size={14} /> Mốc thời gian</div>
            <div className="stat-value">{statsTotal.milestones}</div>
          </div>
        </div>
      </div>

      <AdminDashboardCharts
        allUsers={allUsers}
        students={students}
        supervisors={supervisors}
        teams={teamList}
        milestones={milestoneList}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData({ silent: false })}
        years={years}
        yearForCharts={yearForCharts}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
      />
    </div>
  );
}
