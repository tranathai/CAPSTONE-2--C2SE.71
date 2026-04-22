import { useCallback } from "react";
import { listUsers, setUserStatus } from "../../../lib/api";
import { useAsyncResource } from "../../../hooks/useAsyncResource";
import "../../../styles/content.css";

function AdminUsersPage() {
  const loader = useCallback(() => listUsers(), []);
  const { data, error, loading, reload } = useAsyncResource(loader);
  const users = data ?? [];

  const toggleStatus = async (id, currentStatus) => {
    await setUserStatus(id, currentStatus === "active" ? "inactive" : "active");
    await reload();
  };

  return (
    <div className="submissions-page">
      <h1 className="page-title">User Management</h1>
      {loading ? <div className="page-status">Dang tai...</div> : null}
      {error ? <div className="form-error">{error}</div> : null}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.status}</td>
                <td>
                  <button
                    className="review-btn secondary"
                    type="button"
                    onClick={() => toggleStatus(user.id, user.status)}
                  >
                    {user.status === "active" ? "Lock" : "Unlock"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
