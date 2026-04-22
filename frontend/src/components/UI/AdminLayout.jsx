import { NavLink, Outlet } from "react-router-dom";
import Header from "./Header";
import "../../styles/layout.css";

function AdminLayout() {
  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sb-brand">
          <div className="sb-brand-text">Admin Console</div>
        </div>
        <nav className="sb-nav">
          <NavLink className="sb-item" to="/admin/users">
            Users
          </NavLink>
          <NavLink className="sb-item" to="/admin/teacher-requests">
            Teacher Requests
          </NavLink>
          <NavLink className="sb-item" to="/admin/milestones">
            Milestones
          </NavLink>
          <NavLink className="sb-item" to="/admin/logs">
            Logs
          </NavLink>
        </nav>
      </div>
      <div className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
