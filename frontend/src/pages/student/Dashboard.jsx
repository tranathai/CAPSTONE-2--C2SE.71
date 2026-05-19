import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, milestones, teams, notifications, topics } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  buildDocumentDeadlineWarnings,
  formatWarningMessage,
} from "../../lib/deadlineWarnings.js";
import { computeProjectDocumentProgress } from "../../lib/projectDocumentProgress.js";
import { STUDENT_SUBMISSIONS_CHANGED } from "../../lib/studentSubmissionEvents.js";
import { getStudentVisibleMilestonesForSlots } from "../../lib/studentMilestones.js";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [team, setTeam] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [allMilestones, setAllMilestones] = useState([]);
  const [topicRaw, setTopicRaw] = useState(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [t, topicsData, subs, ms, notifs] = await Promise.all([
        teams.myTeam(),
        topics.myTopic(),
        submissions.my(),
        milestones.list(),
        notifications.list({ limit: 50 }),
      ]);
      const teamsArr = Array.isArray(t) ? t : t ? [t] : [];
      setTeam(teamsArr[0] || null);
      setMySubmissions(subs);
      setAllMilestones(ms);
      setTopicRaw(topicsData);
      const slots = Array.isArray(topicsData) ? topicsData : topicsData && topicsData.id ? [topicsData] : [];
      const visibleMs = getStudentVisibleMilestonesForSlots(ms, slots);
      const visibleIds = new Set(visibleMs.map((m) => Number(m.id)));
      const now = Date.now();
      const upcoming = ms
        .filter((m) => visibleIds.has(Number(m.id)))
        .filter((m) => {
          const endMs = new Date(m.end_date).getTime();
          return Number.isFinite(endMs) && endMs >= now;
        })
        .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
        .slice(0, 5);
      setUpcomingMilestones(upcoming);
      setRecentNotifs(notifs);
    } catch {
      /* ignore */
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onDashboard =
      location.pathname === "/student/dashboard" || location.pathname === "/student";
    if (onDashboard) loadDashboard();
  }, [loadDashboard, location.pathname]);

  useEffect(() => {
    const onChanged = () => loadDashboard(true);
    window.addEventListener(STUDENT_SUBMISSIONS_CHANGED, onChanged);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadDashboard(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(STUDENT_SUBMISSIONS_CHANGED, onChanged);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadDashboard]);

  const docProgress = useMemo(
    () =>
      computeProjectDocumentProgress({
        milestones: allMilestones,
        submissions: mySubmissions,
        topicRaw,
      }),
    [allMilestones, mySubmissions, topicRaw],
  );

  const deadlineWarnings = useMemo(
    () =>
      buildDocumentDeadlineWarnings({
        milestones: allMilestones,
        submissions: mySubmissions,
        topicRaw,
        warnDays: 3,
      }),
    [allMilestones, mySubmissions, topicRaw],
  );

  const recentFeedCount = deadlineWarnings.length + recentNotifs.length;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Xin chào, {user?.full_name}!</h1>
        <p>Theo dõi tiến độ dự án và các công việc cần làm</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Icon name="FileText" size={14} /> Tổng tài liệu</div>
          <div className="stat-value">{docProgress.totalRequired}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="CheckCircle" size={14} /> Đã nộp</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{docProgress.submittedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="AlertTriangle" size={14} /> Chưa nộp</div>
          <div
            className="stat-value"
            style={{ color: docProgress.missingCount > 0 ? "#dc2626" : "#64748b" }}
          >
            {docProgress.missingCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Users" size={14} /> Thành viên nhóm</div>
          <div className="stat-value">{team?.members?.length || 0}</div>
        </div>
      </div>

      {docProgress.totalRequired > 0 && (
        <div className="card">
          <div className="card-title">Tiến độ dự án</div>
          <div style={{ marginBottom: 8, fontSize: "0.875rem", color: "#64748b" }}>
            {docProgress.progressPercent}% — đã nộp {docProgress.submittedCount}/{docProgress.totalRequired} tài liệu
            {docProgress.lateCount > 0 ? ` (${docProgress.lateCount} trễ hạn)` : ""}
          </div>
          <div style={{ background: "#e2e8f0", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div
              style={{
                background: "#3b82f6",
                height: "100%",
                width: `${docProgress.progressPercent}%`,
                borderRadius: 8,
                transition: "width 0.5s",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-title"><Icon name="Calendar" size={14} style={{ marginRight: 6 }} />Mốc thời gian sắp tới</div>
          {upcomingMilestones.length === 0 ? (
            <p className="empty-hint">Không có mốc thời gian sắp tới</p>
          ) : (
            upcomingMilestones.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontWeight: 500 }}>{m.name}</span>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                  {new Date(m.end_date).toLocaleDateString("vi-VN")}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div
            className="card-title"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
          >
            <span>Thông báo gần đây</span>
            {recentFeedCount > 5 ? (
              <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 400 }}>Cuộn để xem thêm</span>
            ) : null}
          </div>
          {recentFeedCount === 0 ? (
            <p className="empty-hint">Không có thông báo</p>
          ) : (
            <div className="dashboard-notif-feed">
              {deadlineWarnings.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => navigate("/student/submissions")}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 0",
                    margin: 0,
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid #fecaca",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Icon name="AlertTriangle" size={14} />
                    {w.kind === "overdue" ? "Quá hạn — chưa nộp" : "Sắp hết hạn — chưa nộp"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#dc2626", marginTop: 4, lineHeight: 1.45 }}>
                    {formatWarningMessage(w)}
                  </div>
                </button>
              ))}
              {recentNotifs.map((n) => (
                <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{n.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .empty-hint { color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 16px; }
        .dashboard-notif-feed {
          max-height: 17.5rem;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .dashboard-notif-feed::-webkit-scrollbar { width: 6px; }
        .dashboard-notif-feed::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
