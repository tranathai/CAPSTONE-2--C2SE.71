import { useState, useEffect } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { teams } from "../../lib/api.js";

export default function StudentTeam() {
  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teams
      .myTeam()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data ? [data] : [];
        setTeamList(arr);
      })
      .catch(() => setTeamList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  if (!teamList.length) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Danh bạ nhóm</h1>
        </div>
        <div className="card empty-state">
          <Icon name="Users" size={48} sx={{ opacity: 0.3 }} />
          <h3>Bạn chưa thuộc nhóm nào</h3>
          <p>Liên hệ quản trị viên để được thêm vào nhóm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Danh bạ nhóm</h1>
        <p>Thông tin các nhóm bạn tham gia và thành viên</p>
      </div>

      {teamList.map((team) => (
        <div key={team.id} className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{team.name}</h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: 2 }}>
                {team.semester ? `Học kỳ: ${team.semester}` : ""}{team.semester && team.leader_name ? " • " : ""}
                {team.leader_name ? `Trưởng nhóm: ${team.leader_name}` : ""}
              </p>
              <p style={{ color: "#475569", fontSize: "0.85rem", marginTop: 4 }}>
                Giảng viên hướng dẫn: <strong>{team.supervisor_name || "—"}</strong>
                {team.supervisor_email ? ` • ${team.supervisor_email}` : ""}
              </p>
            </div>
            {team.topic && (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Đề tài</span>
                <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{team.topic.title}</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              <Icon name="Users" size={14} sx={{ marginRight: 6 }} />
              Thành viên ({team.members?.length || 0})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {team.members?.map((m) => (
                <div key={`${team.id}-${m.id}`} style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, background: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                      {m.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 6 }}>
                        {m.full_name}
                        {Number(m.is_leader) === 1 ? <Icon name="Star" size={14} color="#f59e0b" sx={{ color: "#f59e0b", fill: "#f59e0b" }} /> : null}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {m.student_code ? `MSSV: ${m.student_code}` : "Giảng viên"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.82rem", color: "#475569" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="Mail" size={13} /> {m.email}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="Phone" size={13} /> {m.phone || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
