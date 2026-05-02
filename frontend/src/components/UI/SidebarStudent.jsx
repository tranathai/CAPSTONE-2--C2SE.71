import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  User,
  Plus,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import "../../styles/sidebar.css";

function SidebarStudent() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.toLowerCase();
  const isMyProjectActive =
    normalizedPath.startsWith("/student/submissions") ||
    normalizedPath.startsWith("/student/project-management/");

  return (
    <div className="sidebar">
      <div>
        <div className="sb-brand">
          <div className="sb-brand-icon" aria-hidden="true">
            <GraduationCap size={18} color="#fff" />
          </div>
          <div className="sb-brand-text">MentorAI Grad</div>
        </div>

        <div className="sb-profile">
          <img
            className="sb-profile-img"
            src="https://i.pravatar.cc/80?img=32"
            alt="Student profile"
          />
          <div className="sb-profile-meta">
            <div className="sb-profile-name">Student</div>
            <div className="sb-profile-role">Project Member</div>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Student Sidebar">
          <NavLink
            className={({ isActive }) => `sb-item ${isActive ? "active" : ""}`}
            to="/student/dashboard"
            end
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink
            className={() => `sb-item ${isMyProjectActive ? "active" : ""}`}
            to="/student/submissions"
            end
          >
            <FileText size={18} />
            My Project
          </NavLink>
          <NavLink
            className={({ isActive }) => `sb-item ${isActive ? "active" : ""}`}
            to="/student/feedback"
            end
          >
            <BarChart3 size={18} />
            Feedback
          </NavLink>
          {/* Chuyển button Team thành NavLink */}
          <NavLink
            className="sb-item"
            to="/student/team"  // Đảm bảo đường dẫn đúng
          >
            <Users size={18} />
            Team
          </NavLink>
          {/* Chuyển button Profile thành NavLink */}
          <NavLink
            className="sb-item"
            to="/student/profile"  // Đảm bảo đường dẫn đúng
          >
            <User size={18} />
            Profile
          </NavLink>
        </nav>
      </div>

      <div className="sb-footer">
        <button className="sb-new-project" type="button">
          <Plus size={16} />
          New Project
        </button>
      </div>
    </div>
  );
}

export default SidebarStudent;