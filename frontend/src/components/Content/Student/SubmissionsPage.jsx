import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSubmissions } from "../../../lib/api";
import "../../../styles/content.css";

const PROJECT_SUBMISSIONS_KEY = "mentorai_project_submissions";

function readLocalSubmissions() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECT_SUBMISSIONS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSubmission(row, index) {
  return {
    id: row.id ?? `${row.projectTitle || row.projectName || "submission"}-${index}`,
    title: row.title || row.projectTitle || row.projectName || "Submission",
    team_name: row.team_name || row.teamName || row.team || "-",
    milestone_name: row.milestone_name || row.milestoneName || row.milestone || "-",
    student_name: row.student_name || row.studentName || row.submittedBy || row.student || "-",
    version_number: row.version_number || row.versionNumber || row.version || 1,
  };
}

function SubmissionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await listSubmissions();
        if (active) {
          const apiItems = Array.isArray(data) ? data : [];
          const fallbackItems = readLocalSubmissions().map(normalizeSubmission);
          setItems(apiItems.length > 0 ? apiItems : fallbackItems);
        }
      } catch (e) {
        if (active) {
          const fallbackItems = readLocalSubmissions().map(normalizeSubmission);
          if (fallbackItems.length > 0) {
            setItems(fallbackItems);
            setError("");
          } else {
            setError(e.message || "Không tải được danh sách submissions.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="submissions-page submissions-simple-page">
      <div className="page-header-row submissions-simple-header">
        <h1 className="page-title">Tất cả submissions</h1>
        <p className="page-lead">
          Giảng viên xem và mở trang review cho từng bài nộp.
        </p>
      </div>

      {loading ? (
        <div className="page-status">Đang tải...</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="page-muted">Chưa có submission.</div>
      ) : (
        <div className="submissions-simple-table-wrap">
          <table className="submissions-simple-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Team</th>
                <th>Milestone</th>
                <th>Sinh viên</th>
                <th>Phiên bản</th>
                <th aria-label="Action" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.title || "Submission"}</td>
                  <td>{row.team_name || "-"}</td>
                  <td>{row.milestone_name || "-"}</td>
                  <td>{row.student_name || "-"}</td>
                  <td>{`v${row.version_number || 1}`}</td>
                  <td>
                    <Link className="table-link" to={`/mentor/review/${row.id}`}>
                      Xem review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SubmissionsPage;
