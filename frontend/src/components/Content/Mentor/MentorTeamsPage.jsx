import { useCallback, useMemo, useState } from "react";
import { getTeamMembers, getTeams } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import TeamChatBox from "../Common/TeamChatBox";
import "../../../styles/content.css";

function MentorTeamsPage() {
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const teamsResource = useAsyncResource(useCallback(() => getTeams(), []));

  const membersResource = useAsyncResource(
    useCallback(async () => {
      if (!selectedTeamId) return [];
      return getTeamMembers(selectedTeamId);
    }, [selectedTeamId]),
  );

  const selectedTeam = useMemo(
    () => (teamsResource.data || []).find((team) => Number(team.id) === Number(selectedTeamId)) || null,
    [teamsResource.data, selectedTeamId],
  );

  return (
    <div className="submissions-page">
      <h1 className="page-title">Supervisee Teams</h1>
      <p className="page-lead">Xem danh sach team, thanh vien va trao doi nhanh trong team chat.</p>

      {teamsResource.error ? <div className="form-error">{teamsResource.error}</div> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Team</th>
              <th>Invite code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(teamsResource.data || []).map((team) => (
              <tr key={team.id}>
                <td>{team.id}</td>
                <td>{team.name}</td>
                <td>{team.invite_code || "—"}</td>
                <td>
                  <button className="review-btn secondary" type="button" onClick={() => setSelectedTeamId(team.id)}>
                    Open
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
    </div>
  );
}

export default MentorTeamsPage;
