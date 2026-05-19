import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Icon from "../../components/UI/Icon.jsx";
import { submissions, topics } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";
import { useSocket } from "../../context/SocketContext.jsx";

export default function MentorDashboard() {
  const { user } = useAuth();
  const { on, off } = useSocket();
  const [stats, setStats] = useState(null);
  const [pendingTopics, setPendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const weeklyChartData = useMemo(() => {
    const rows = stats?.weekly_backlog;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows.map((w) => ({
      label: w.label,
      da_phan_hoi: Number(w.reviewed) || 0,
      cho_phan_hoi: Number(w.pending) || 0,
    }));
  }, [stats]);

  const reloadDashboard = useCallback(() => {
    return Promise.all([submissions.stats(), topics.pending()])
      .then(([st, pt]) => {
        setStats(st);
        setPendingTopics(pt);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reloadDashboard().finally(() => setLoading(false));
  }, [reloadDashboard]);

  useMentorScopeRefresh(reloadDashboard);

  useEffect(() => {
    const refresh = () => {
      reloadDashboard();
    };
    on("topic_pending_refresh", refresh);
    on("new_notification", refresh);
    on("new_group_message", refresh);
    return () => {
      off("topic_pending_refresh", refresh);
      off("new_notification", refresh);
      off("new_group_message", refresh);
    };
  }, [on, off, reloadDashboard]);

  // Fallback polling in case socket event is missed.
  useEffect(() => {
    const timer = setInterval(() => {
      reloadDashboard();
    }, 15000);
    return () => clearInterval(timer);
  }, [reloadDashboard]);

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

      {weeklyChartData.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">
            <Icon name="BarChart" size={14} sx={{ marginRight: 6 }} />
            Tài liệu theo tuần (Đã phản hồi vs Chờ phản hồi)
          </div>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 12 }}>
            Theo tuần lịch (Thứ Hai–Chủ Nhật). Xanh: tài liệu được đánh dấu đã phản hồi trong tuần. Cam: tài liệu chờ phản hồi, có bản nộp mới nhất trong tuần.
          </p>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf5" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-22} textAnchor="end" height={72} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 12px 32px rgba(15,23,42,0.14)",
                  }}
                />
                <Legend />
                <Bar dataKey="cho_phan_hoi" name="Chờ phản hồi" stackId="backlog" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="da_phan_hoi" name="Đã phản hồi" stackId="backlog" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
