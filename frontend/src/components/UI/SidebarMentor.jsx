import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import "../../styles/sidebar.css";

function SidebarMentor() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.toLowerCase();
  const isReviewContext =
    normalizedPath.startsWith("/mentor/review/") ||
    normalizedPath.startsWith("/mentor/submissions");

  return (
    <div className="sidebar">
      <div>
        <div className="sb-brand">
          <div className="sb-brand-icon" aria-hidden="true" />
          <div className="sb-brand-text">MentorAI Grad</div>
        </div>

        <div className="sb-profile">
          <div className="sb-profile-avatar" aria-hidden="true">H</div>
          <div className="sb-profile-meta">
            <div className="sb-profile-name">henny4</div>
            <div className="sb-profile-role">Senior Instructor</div>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Mentor Sidebar">
          <NavLink
            className={({ isActive }) => `sb-item ${isActive ? "active" : ""}`}
            to="/teacher-dashboard"
            end
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <button className="sb-item" type="button">
            <FolderKanban size={18} />
            Projects
          </button>
          <NavLink
            className={({ isActive }) => `sb-item ${isActive || isReviewContext ? "active" : ""}`}
            to="/mentor/submissions"
            end
          >
            <FileText size={18} />
            Submissions
          </NavLink>
          <button className="sb-item" type="button">
            <Users size={18} />
            Teams
          </button>
          <button className="sb-item" type="button">
            <Settings size={18} />
            Settings
          </button>
        </nav>
      </div>
    </div>
  );
}

export default SidebarMentor;
