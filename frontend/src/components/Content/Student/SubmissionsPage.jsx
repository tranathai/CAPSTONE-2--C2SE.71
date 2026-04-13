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
        <h1 className="page-title">Tất cả submissions</h1>
        <p className="page-lead">
          Giảng viên xem và mở trang review cho từng bài nộp.
        </p>
      </div>

      {loading ? (
        <div className="page-status">Đang tải…</div>
      ) : error ? (
        <div className="form-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="page-muted">Chưa có submission.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Team</th>
                <th>Milestone</th>
                <th>Sinh viên</th>
                <th>Phiên bản</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.title}</td>
                  <td>{row.team_name}</td>
                  <td>{row.milestone_name || "—"}</td>
                  <td>{row.student_name || "—"}</td>
                  <td>v{row.version_number}</td>
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
