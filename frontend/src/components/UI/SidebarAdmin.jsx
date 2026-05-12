import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";
import "./Sidebar.css";

const navItems = [
  { to: "/admin/dashboard", icon: "Dashboard", label: "Dashboard" },
  { to: "/admin/users", icon: "People", label: "Người dùng" },
  { to: "/admin/teams", icon: "Groups", label: "Nhóm" },
  { to: "/admin/milestones", icon: "Flag", label: "Mốc thời gian" },
];

export default function SidebarAdmin() {
  return (
    <aside className="sidebar sidebar-admin">
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
