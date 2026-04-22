import { useCallback } from "react";
import { listAuditLogs } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import "../../../styles/content.css";

function AdminLogsPage() {
  const logsResource = useAsyncResource(useCallback(() => listAuditLogs(), []));
  const logs = logsResource.data || [];

  return (
    <div className="submissions-page">
      <h1 className="page-title">System Logs</h1>
      <p className="page-lead">Theo doi hanh dong thay doi du lieu trong he thong.</p>
      {logsResource.loading ? <div className="page-status">Dang tai logs...</div> : null}
      {logsResource.error ? <div className="form-error">{logsResource.error}</div> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{log.actor_user_id || "system"}</td>
                <td>{log.action}</td>
                <td>{log.entity_type}</td>
                <td>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminLogsPage;
