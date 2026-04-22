import { useCallback } from "react";
import { getSupervisorDashboard } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import "../../../styles/content.css";

function MentorDashboardPage() {
  const loader = useCallback(() => getSupervisorDashboard(), []);
  const { data, loading, error } = useAsyncResource(loader);

  return (
    <div className="submissions-page">
      <h1 className="page-title">Supervisor Dashboard</h1>
      <p className="page-lead">Tong quan bai nop can review va tinh trang tre han.</p>
      {loading ? <div className="page-status">Dang tai dashboard...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      {data ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="upload-card">
            <h3 className="section-title">Pending Reviews</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.pendingReviews}</div>
          </div>
          <div className="upload-card">
            <h3 className="section-title">Late Submissions</h3>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{data.lateSubmissions}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MentorDashboardPage;
