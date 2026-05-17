import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../../components/UI/Icon.jsx";
import { teams } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";
import "../../styles/content.css";

function studentMembers(members) {
  return (members || []).filter((m) => m.student_code);
}

function TeamLeaderMenu({ team, open, onToggle, onSelectLeader, busy }) {
  const menuRef = useRef(null);
  const students = studentMembers(team.members);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, onToggle]);

  if (!students.length) return null;

  return (
    <div ref={menuRef} className="team-leader-menu">
      <button
        type="button"
        className="team-leader-menu__trigger"
        aria-label="Chọn hoặc đổi trưởng nhóm"
        aria-expanded={open}
        disabled={busy}
        onClick={() => onToggle(!open)}
      >
        <Icon name="MoreVert" size={20} />
      </button>
      {open && (
        <div className="team-leader-menu__dropdown" role="menu">
          <p className="team-leader-menu__title">Chọn trưởng nhóm</p>
          {students.map((m) => {
            const isLeader = Number(m.is_leader) === 1;
            return (
              <button
                key={m.id}
                type="button"
                role="menuitem"
                className={`team-leader-menu__item${isLeader ? " team-leader-menu__item--active" : ""}`}
                disabled={busy || isLeader}
                onClick={() => onSelectLeader(team.id, m.id)}
              >
                <span className="team-leader-menu__item-name">{m.full_name}</span>
                {isLeader ? (
                  <span className="team-leader-menu__badge">Đang là trưởng nhóm</span>
                ) : (
                  <span className="team-leader-menu__action">Đặt làm trưởng nhóm</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentTeam() {
  const { toast, showToast } = useToast();
  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openLeaderMenuTeamId, setOpenLeaderMenuTeamId] = useState(null);
  const [leaderBusyTeamId, setLeaderBusyTeamId] = useState(null);

  const loadTeams = useCallback(() => {
    return teams
      .myTeam()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data ? [data] : [];
        setTeamList(arr);
      })
      .catch(() => setTeamList([]));
  }, []);

  useEffect(() => {
    loadTeams().finally(() => setLoading(false));
  }, [loadTeams]);

  const handleSetLeader = async (teamId, leaderUserId) => {
    if (leaderBusyTeamId != null) return;
    setLeaderBusyTeamId(teamId);
    try {
      await teams.setLeader(teamId, leaderUserId);
      showToast("Đã cập nhật trưởng nhóm", "success");
      setOpenLeaderMenuTeamId(null);
      await loadTeams();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Không thể đổi trưởng nhóm";
      showToast(msg, "error");
    } finally {
      setLeaderBusyTeamId(null);
    }
  };

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
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <h1>Danh bạ nhóm</h1>
        <p>Thông tin các nhóm bạn tham gia và thành viên</p>
      </div>

      {teamList.map((team) => {
        const memberCols = Math.min(Math.max(team.members?.length || 1, 1), 5);
        return (
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
              <div className="team-members-section-header">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  <Icon name="Users" size={14} sx={{ marginRight: 6 }} />
                  Thành viên ({team.members?.length || 0})
                </div>
                <TeamLeaderMenu
                  team={team}
                  open={openLeaderMenuTeamId === team.id}
                  onToggle={(next) => setOpenLeaderMenuTeamId(next ? team.id : null)}
                  onSelectLeader={handleSetLeader}
                  busy={leaderBusyTeamId === team.id}
                />
              </div>
              <div className="team-members-grid" style={{ "--member-cols": memberCols }}>
                {team.members?.map((m) => (
                  <div key={`${team.id}-${m.id}`} className="team-member-card">
                    <div className="team-member-card__header">
                      <div className="team-member-card__avatar">{m.full_name?.charAt(0) || "?"}</div>
                      <div className="team-member-card__info">
                        <div className="team-member-card__name">
                          {m.full_name}
                          {Number(m.is_leader) === 1 ? (
                            <Icon name="Star" size={14} color="#f59e0b" sx={{ color: "#f59e0b", fill: "#f59e0b", flexShrink: 0 }} />
                          ) : null}
                        </div>
                        <div className="team-member-card__mssv">
                          {m.student_code ? `MSSV: ${m.student_code}` : "Giảng viên"}
                        </div>
                      </div>
                    </div>
                    <div className="team-member-card__contact">
                      <div className="team-member-card__contact-row">
                        <Icon name="Mail" size={13} />
                        <span title={m.email}>{m.email}</span>
                      </div>
                      <div className="team-member-card__contact-row">
                        <Icon name="Phone" size={13} />
                        <span>{m.phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
