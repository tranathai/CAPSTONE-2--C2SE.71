import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, topics } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function MentorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      submissions.stats(),
      topics.pending(),
    ]).then(([st, pt]) => {
      setStats(st);
      setPendingTopics(pt);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Xin chào, {user?.full_name}!</h1>
        <p>Tổng quan các nhóm và công việc cần xử lý</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Icon name="Folder" size={14} /> Tổng nhóm</div>
          <div className="stat-value">{stats?.total_groups ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Description" size={14} /> Bài nộp mới (7 ngày)</div>
          <div className="stat-value" style={{ color: "#2563eb" }}>{stats?.new_submissions ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Warning" size={14} /> Bài trễ hạn</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>{stats?.late_submissions ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Schedule" size={14} /> Đề tài chờ duyệt</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>{stats?.pending_topics ?? 0}</div>
        </div>
      </div>

      {pendingTopics.length > 0 && (
        <div className="card">
          <div className="card-title"><Icon name="Schedule" size={14} sx={{ marginRight: 6 }} />Đề tài chờ duyệt ({pendingTopics.length})</div>
          {pendingTopics.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.title}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Nhóm: {t.team_name} • {t.member_count} thành viên
                </div>
              </div>
              <a href="/supervisor/topics" className="btn btn-sm btn-primary">Duyệt</a>
            </div>
          ))}
        </div>
      )}

      {stats?.at_risk_groups?.length > 0 && (
        <div className="card">
          <div className="card-title"><Icon name="Warning" size={14} sx={{ marginRight: 6, color: "#dc2626" }} />Nhóm có nguy cơ</div>
          {stats.at_risk_groups.map((g) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{g.name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {Number(g.late_count) > 0 && <span className="badge badge-danger">{g.late_count} bài trễ</span>}
                {Number(g.missing_count) > 0 && <span className="badge badge-warning">{g.missing_count} thiếu</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
