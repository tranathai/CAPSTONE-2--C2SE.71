import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTeams } from "../../../lib/api";
import { DEMO_TEAM_ID } from "../../../config/demoUser";
import "../../../styles/content.css";

function MyProjectsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const allTeams = await getTeams();
        const filtered = allTeams.filter((team) => team.id === DEMO_TEAM_ID);
        if (active) setTeams(filtered.length ? filtered : allTeams);
      } catch (e) {
        if (active) setError(e.message || "Khong tai duoc danh sach project");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="submissions-page">
      <div className="page-header-row">
        <h1 className="page-title">My Project</h1>
        <p className="page-lead">Danh sach project ban dang tham gia.</p>
      </div>

      {loading ? (
        <div className="page-status">Dang tai project...</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : teams.length === 0 ? (
        <div className="page-muted">Chua co project nao.</div>
      ) : (
        <ul className="submission-link-list">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                className="submission-link"
                to={`/student/project-management/${team.id}`}
              >
                <span className="submission-link-title">{team.name}</span>
                <span className="submission-link-meta">
                  Bam de vao trang quan ly deliverables
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyProjectsPage;
