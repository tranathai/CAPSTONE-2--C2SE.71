import { useCallback } from "react";
import { listTeacherRequests } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import "../../../styles/content.css";

function AdminTeacherRequestsPage() {
  const { data, loading, error, reload } = useAsyncResource(
    useCallback(() => listTeacherRequests(), []),
  );
  const items = data || [];

  return (
    <div className="submissions-page">
      <h1 className="page-title">Teacher Requests</h1>
      <p className="page-lead">Danh sach yeu cau Become Instructor va trang thai xu ly.</p>
      {loading ? <div className="page-status">Dang tai...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <button className="review-btn secondary" type="button" onClick={reload}>
        Refresh
      </button>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Status</th>
              <th>CV</th>
              <th>Degree</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.full_name || item.email}</td>
                <td>{item.status}</td>
                <td>
                  <a className="table-link" href={`http://localhost:5000${item.cv_file_path}`} target="_blank" rel="noreferrer">
                    View CV
                  </a>
                </td>
                <td>
                  <a className="table-link" href={`http://localhost:5000${item.degree_file_path}`} target="_blank" rel="noreferrer">
                    View Degree
                  </a>
                </td>
                <td>{item.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTeacherRequestsPage;
