import { useEffect, useMemo, useState } from "react";
import { getTeams } from "../../../lib/api";
import { DEMO_TEAM_ID } from "../../../config/demoUser";
import "../../../styles/content.css";

const PROJECT_SUBMISSIONS_KEY = "mentorai_project_submissions";

function readProjectSubmissions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSubmissionStatus(rawStatus) {
  const value = String(rawStatus || "").trim().toLowerCase();
  if (["accepted", "approve", "approved", "access"].includes(value)) return "accepted";
  return "pending";
}

function getApprovedProjects() {
  const submissions = readProjectSubmissions();
  return submissions
    .filter((item) => normalizeSubmissionStatus(item.status) === "accepted")
    .map((item) => ({
      id: `approved-${item.id}`,
      name: item.projectTitle || item.projectName || "Unnamed Project",
      meta: "Group project",
      submissionId: item.id,
      clickable: false,
    }));
}

function ProjectItem({ item, onProjectSelect }) {
  const content = (
    <>
      <div className="submission-link-main">
        <span className="submission-link-title">{item.name}</span>
      </div>
      <span className="submission-link-meta">{item.meta || "Group project"}</span>
    </>
  );

  if (item.clickable && onProjectSelect) {
    return (
      <div
        className="submission-link submission-link-button"
        onClick={() => onProjectSelect(item.teamId)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onProjectSelect(item.teamId);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {content}
      </div>
    );
  }

  return (
    <div className="submission-link submission-link-button submission-link-static">
      {content}
    </div>
  );
}

function MyProjectsPage({ onProjectSelect }) {
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

  const approvedProjects = useMemo(() => getApprovedProjects(), []);
  const projectItems = useMemo(() => {
    const teamItems = teams.map((team) => ({
      id: `team-${team.id}`,
      name: team.name,
      meta: "Group project",
      teamId: team.id,
      clickable: true,
    }));

    const merged = [...teamItems, ...approvedProjects];
    const seen = new Set();

    return merged.filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [teams, approvedProjects]);

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
      ) : projectItems.length === 0 ? (
        <div className="page-muted">Chua co project nao.</div>
      ) : (
        <ul className="submission-link-list">
          {projectItems.map((item) => (
            <li key={item.id}>
              <ProjectItem item={item} onProjectSelect={onProjectSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyProjectsPage;
