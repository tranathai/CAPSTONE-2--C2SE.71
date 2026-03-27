import {
  LayoutDashboard,
  Folder,
  FileText,
  Users,
  Settings,
  GraduationCap,
  Plus,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import "../../styles/sidebar.css";

function Sidebar() {
  const { pathname } = useLocation();
  const activeItem = pathname.includes("review") ? "projects" : "dashboard";

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
            src="https://i.pravatar.cc/80"
            alt="Dr. Smith"
          />
          <div className="sb-profile-meta">
            <div className="sb-profile-name">Dr. Smith</div>
            <div className="sb-profile-role">Senior Instructor</div>
          </div>
        </div>

        <nav className="sb-nav" aria-label="Sidebar">
          <button
            className={`sb-item ${activeItem === "dashboard" ? "active" : ""}`}
            type="button"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            className={`sb-item ${activeItem === "projects" ? "active" : ""}`}
            type="button"
          >
            <Folder size={18} />
            Projects
          </button>
          <button className="sb-item" type="button">
            <FileText size={18} />
            Submissions
          </button>
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

      <div className="sb-footer">
        <button className="sb-new-project" type="button">
          <Plus size={16} />
          New Project
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
