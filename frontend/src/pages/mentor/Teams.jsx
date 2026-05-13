import { useState, useEffect, useCallback } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { teams } from "../../lib/api.js";
import { useMentorScopeRefresh } from "../../hooks/useMentorScopeRefresh.js";

export default function MentorTeams() {
  const [teamList, setTeamList] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const reloadTeams = useCallback(() => {
    return teams.supervisees().then(setTeamList).catch(() => {});
  }, []);

  useEffect(() => {
    reloadTeams().finally(() => setLoading(false));
  }, [reloadTeams]);

  useMentorScopeRefresh(reloadTeams);

  const selectTeam = async (id) => {
    if (selectedTeam?.id === id) { setSelectedTeam(null); return; }
    const t = await teams.get(id).catch(() => null);
    setSelectedTeam(t);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Nhóm được phân công</h1>
        <p>Theo dõi tiến độ các nhóm bạn hướng dẫn</p>
      </div>

      {teamList.length === 0 ? (
        <div className="card empty-state">
          <Icon name="Folder" size={48} sx={{ opacity: 0.3 }} />
          <h3>Chưa có nhóm nào được phân công</h3>
          <p>Duyệt đề tài để bắt đầu hướng dẫn nhóm</p>
        </div>
      ) : (
        teamList.map((t) => (
          <div key={t.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => selectTeam(t.id)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{t.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                  {t.leader_name ? `Trưởng nhóm: ${t.leader_name}` : ""} • {t.member_count} thành viên
                </div>
              </div>
              <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{t.semester || ""}</span>
            </div>
            {selectedTeam?.id === t.id && (
              <div style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {selectedTeam.members?.map((m) => (
                    <div key={m.id} style={{ background: "#f8fafc", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{m.full_name} {m.is_leader && "👑"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{m.email}</div>
                    </div>
                  ))}
                </div>
                {selectedTeam.topic && (
                  <div style={{ marginTop: 12, background: "#eff6ff", borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Đề tài: {selectedTeam.topic.title}</div>
                    {selectedTeam.topic.technologies && <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{selectedTeam.topic.technologies}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
