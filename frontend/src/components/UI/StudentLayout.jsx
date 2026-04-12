import { Outlet } from "react-router-dom";
import SidebarStudent from "./SidebarStudent";
import Header from "./Header";
import "../../styles/layout.css";

function StudentLayout() {
  return (
    <div className="layout">
      <SidebarStudent />
      <div className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;
