import {
  GraduationCap,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
  Plus,
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
          <div className="sb-brand-icon" aria-hidden="true">
            <GraduationCap size={18} color="#fff" />
          </div>
          <div className="sb-brand-text">MentorAI Grad</div>
        </div>

        <div className="sb-profile">
          <img
            className="sb-profile-img"
            src="https://i.pravatar.cc/80?img=13"
            alt="Dr. Smith"
          />
          <div className="sb-profile-meta">
            <div className="sb-profile-name">Dr. Smith</div>
            <div className="sb-profile-role">Senior Instructor</div>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Mentor Sidebar">
          <button className="sb-item" type="button">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
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
          <NavLink
            className="sb-item"
            to="/mentor/team"  // Đảm bảo đường dẫn đúng
          >
            <Users size={18} />
            Team
          </NavLink>
          <button className="sb-item" type="button">
            <Settings size={18} />
            Settings
          </button>
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

export default SidebarMentor;
