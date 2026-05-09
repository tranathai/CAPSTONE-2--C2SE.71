import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, milestones, teams, notifications } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [upcomingMilestones, setUpcomingMilestones] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [stats, setStats] = useState({ total: 0, onTime: 0, late: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teams.myTeam(),
      submissions.my(),
      milestones.upcoming(5),
      notifications.list({ limit: 5 }),
    ]).then(([t, subs, ms, notifs]) => {
      setTeam(t);
      setMySubmissions(subs);
      setUpcomingMilestones(ms);
      setRecentNotifs(notifs);
      const onTime = subs.filter((s) => !s.is_late).length;
      setStats({ total: subs.length, onTime, late: subs.length - onTime });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const progress = stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Xin chào, {user?.full_name}!</h1>
        <p>Theo dõi tiến độ dự án và các công việc cần làm</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Icon name="FileText" size={14} /> Tổng bài nộp</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="CheckCircle" size={14} /> Đúng hạn</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{stats.onTime}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="AlertTriangle" size={14} /> Trễ hạn</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>{stats.late}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Users" size={14} /> Thành viên nhóm</div>
          <div className="stat-value">{team?.members?.length || 0}</div>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="card">
          <div className="card-title">Tiến độ dự án</div>
          <div style={{ marginBottom: 8, fontSize: "0.875rem", color: "#64748b" }}>
            {progress}% bài nộp đúng hạn
          </div>
          <div style={{ background: "#e2e8f0", borderRadius: 8, height: 10, overflow: "hidden" }}>
            <div style={{ background: "#3b82f6", height: "100%", width: `${progress}%`, borderRadius: 8, transition: "width 0.5s" }} />
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
          <div className="card-title">Thông báo gần đây</div>
          {recentNotifs.length === 0 ? (
            <p className="empty-hint">Không có thông báo</p>
          ) : (
            recentNotifs.map((n) => (
              <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{n.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{n.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`.empty-hint { color: #94a3b8; font-size: 0.875rem; text-align: center; padding: 16px; }`}</style>
    </div>
  );
}
