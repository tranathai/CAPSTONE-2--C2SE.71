import "../../styles/header.css";
import { Bell, LogOut, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { setRuntimeRole } from "../../config/runtimeRole";

function Header() {
  const navigate = useNavigate();

  function handleLogout() {
    setRuntimeRole("student");
    navigate("/", { replace: true });
  }

  return (
    <div className="header">
      <input className="search" placeholder="Search projects, students..." />

      <div className="header-right">
        <button type="button" className="header-icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button type="button" className="header-icon-btn" aria-label="Messages">
          <MessageSquare size={16} />
        </button>
        <button type="button" className="header-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;
