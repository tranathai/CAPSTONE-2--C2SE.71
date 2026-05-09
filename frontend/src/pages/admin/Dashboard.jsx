import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { users, teams, milestones } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, supervisors: 0, teams: 0, milestones: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      users.list({ role: "student" }),
      users.list({ role: "supervisor" }),
      teams.list(),
      milestones.list(),
    ]).then(([st, sv, tl, ml]) => {
      setStats({
        students: st.length,
        supervisors: sv.length,
        teams: tl.length,
        milestones: ml.length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Xin chào, {user?.full_name}!</h1>
        <p>Quản trị hệ thống MentorAI Grad</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Icon name="User" size={14} /> Sinh viên</div>
          <div className="stat-value">{stats.students}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="User" size={14} /> Giảng viên</div>
          <div className="stat-value">{stats.supervisors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Folder" size={14} /> Nhóm</div>
          <div className="stat-value">{stats.teams}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Icon name="Flag" size={14} /> Mốc thời gian</div>
          <div className="stat-value">{stats.milestones}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Hướng dẫn nhanh</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "Quản lý người dùng", href: "/admin/users", desc: "Tạo, khóa tài khoản, đổi vai trò" },
            { label: "Quản lý nhóm", href: "/admin/teams", desc: "Tạo nhóm, thêm thành viên" },
            { label: "Cấu hình mốc thời gian", href: "/admin/milestones", desc: "Đặt deadline cho đồ án" },
          ].map((item) => (
            <a key={item.href} href={item.href} style={{ display: "block", background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1e40af" }}>{item.label}</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>{item.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
