import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";
import "./Sidebar.css";

const navItems = [
  { to: "/supervisor/dashboard", icon: "Dashboard", label: "Dashboard" },
  { to: "/supervisor/topics", icon: "FactCheck", label: "Duyệt đề tài" },
  { to: "/supervisor/submissions", icon: "Upload", label: "Bài nộp" },
  { to: "/supervisor/teams", icon: "Groups", label: "Nhóm" },
  { to: "/supervisor/meetings", icon: "Calendar", label: "Lịch họp" },
  { to: "/supervisor/messages", icon: "Chat", label: "Nhắn tin" },
];

export default function SidebarMentor() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Icon name="School" size={22} sx={{ color: "#fff" }} />
        <span>MentorAI Grad</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
