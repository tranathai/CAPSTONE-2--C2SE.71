import { Outlet } from "react-router-dom";
import SidebarMentor from "./SidebarMentor.jsx";
import Header from "./Header.jsx";
import "./Sidebar.css";

export default function MentorLayout() {
  return (
    <div className="main-layout">
      <SidebarMentor />
      <div className="main-content">
        <Header />
        <div className="main-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
