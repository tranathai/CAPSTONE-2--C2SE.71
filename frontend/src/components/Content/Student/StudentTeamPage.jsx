import { useCallback, useMemo, useState } from "react";
import { createTeam, getTeamMembers, getTeams, joinTeam } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import TeamChatBox from "../Common/TeamChatBox";
import "../../../styles/content.css";

function StudentTeamPage() {
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [message, setMessage] = useState("");

  const loadTeams = useCallback(() => getTeams(), []);
  const { data, loading, error, reload } = useAsyncResource(loadTeams);
  const loadMembers = useCallback(async () => {
    if (!selectedTeamId) return [];
    return getTeamMembers(selectedTeamId);
  }, [selectedTeamId]);
  const membersResource = useAsyncResource(loadMembers);

  const selectedTeam = useMemo(
    () =>
      (data || []).find((team) => Number(team.id) === Number(selectedTeamId)) ||
      null,
    [data, selectedTeamId],
  );

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    const created = await createTeam({ name: teamName });
    setMessage(`Tao team thanh cong. Invite code: ${created.inviteCode}`);
    setTeamName("");
    await reload();
  };

  const handleJoinTeam = async (event) => {
    event.preventDefault();
    await joinTeam(inviteCode);
    setMessage("Tham gia team thanh cong.");
    setInviteCode("");
    await reload();
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">Team Management</h1>
      <p className="page-lead">Tao team, join bang invite code, va xem thanh vien.</p>
      {message ? <div className="form-success">{message}</div> : null}
      {error ? <div className="form-error">{error}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <form className="upload-card" onSubmit={handleCreateTeam}>
          <h3 className="section-title">Create Team</h3>
          <input className="field-control" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" required />
          <button className="btn-primary" type="submit">Create</button>
        </form>
        <form className="upload-card" onSubmit={handleJoinTeam}>
          <h3 className="section-title">Join Team</h3>
          <input className="field-control" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Invite code" required />
          <button className="btn-primary" type="submit">Join</button>
        </form>
      </div>

      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Invite code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data || []).map((team) => (
              <tr key={team.id}>
                <td>{team.id}</td>
                <td>{team.name}</td>
                <td>{team.invite_code || "—"}</td>
                <td>
                  <button className="review-btn secondary" type="button" onClick={() => setSelectedTeamId(team.id)}>
                    View members
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTeam ? (
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="upload-card">
            <h3 className="section-title">Members - {selectedTeam.name}</h3>
            {membersResource.loading ? <div className="page-muted">Dang tai...</div> : null}
            {membersResource.error ? <div className="form-error">{membersResource.error}</div> : null}
            <ul className="submission-link-list">
              {(membersResource.data || []).map((member) => (
                <li key={`${member.team_id}-${member.user_id}`}>
                  <div className="submission-link">
                    <span className="submission-link-title">{member.full_name}</span>
                    <span className="submission-link-meta">
                      {member.role} {member.is_leader ? "(Leader)" : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <TeamChatBox teamId={selectedTeam.id} />
        </div>
      ) : null}

      {loading ? <div className="page-status">Dang tai teams...</div> : null}
    </div>
  );
}

export default StudentTeamPage;
