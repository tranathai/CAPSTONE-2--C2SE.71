import "../../styles/header.css";
import { useLocation, useNavigate } from "react-router-dom";
import { getRuntimeRole, setRuntimeRole } from "../../config/runtimeRole";

function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const role = getRuntimeRole();

  function handleChangeRole(nextRole) {
    if (nextRole !== "student" && nextRole !== "supervisor") return;
    setRuntimeRole(nextRole);

    if (nextRole === "student" && pathname.startsWith("/mentor")) {
      navigate("/student/dashboard", { replace: true });
      return;
    }
    if (nextRole === "supervisor" && pathname.startsWith("/student")) {
      navigate("/mentor/submissions", { replace: true });
    }
  }

  return (
    <div className="header">
      <input className="search" placeholder="Search projects, students..." />

      <div className="header-right">
        <select
          className="role-select"
          value={role}
          onChange={(e) => handleChangeRole(e.target.value)}
        >
          <option value="student">student</option>
          <option value="supervisor">supervisor</option>
        </select>
        <span>🔔</span>
        <span>💬</span>
        <div className="avatar">DS</div>
      </div>
    </div>
  );
}

export default Header;
