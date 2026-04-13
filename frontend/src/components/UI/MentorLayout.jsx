import { Outlet, useLocation } from "react-router-dom";
import SidebarMentor from "./SidebarMentor";
import Header from "./Header";
import "../../styles/layout.css";

function MentorLayout() {
  return (
    <div className="layout">
      <SidebarMentor />
      <div className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default MentorLayout;
