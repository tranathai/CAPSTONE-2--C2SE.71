import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSubmissions } from "../../../lib/api";
import "../../../styles/content.css";

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
          setItems(data);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Không tải được danh sách");
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
    <div className="submissions-page">
      <div className="page-header-row">
        <h1 className="page-title">Submissions</h1>
        <p className="page-lead">
          Danh sách các bài nộp của bạn
        </p>
      </div>

      {loading ? (
        <div className="page-status">Dang tai...</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="page-muted">Chua co submission.</div>
      ) : (
        <ul className="feedback-list">
          {items.map((item) => (
            <li key={item.id} className="feedback-item">
              <div className="feedback-head">
                <strong>{item.title || "Submission"}</strong>
                <span className="feedback-date">v{item.version_number} • {item.team_name || "—"}</span>
              </div>
              <p className="feedback-body">
                <span style={{ display: "block", marginBottom: "8px" }}>
                  👤 <strong>{item.student_name || "—"}</strong>
                </span>
                {item.milestone_name && (
                  <span style={{ display: "block", marginBottom: "8px" }}>
                    📋 Milestone: {item.milestone_name}
                  </span>
                )}
                <Link className="table-link" to={`/student/review/${item.id}`}>
                  Xem chi tiết →
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubmissionsPage;
