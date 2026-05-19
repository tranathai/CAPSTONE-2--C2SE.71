import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";
import "./Sidebar.css";

const navItems = [
  { to: "/student/dashboard", icon: "Dashboard", label: "Dashboard" },
  { to: "/student/submissions", icon: "Upload", label: "Nộp bài" },
  { to: "/student/topic", icon: "Assignment", label: "Đề tài" },
  { to: "/student/feedback", icon: "Feedback", label: "Phản hồi" },
  { to: "/student/team", icon: "Groups", label: "Nhóm" },
  { to: "/student/meetings", icon: "Calendar", label: "Lịch họp" },
  { to: "/student/messages", icon: "Chat", label: "Nhắn tin" },
  { to: "/student/profile", icon: "Person", label: "Hồ sơ" },
];

export default function SidebarStudent() {
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
