import { Outlet } from "react-router-dom";
import SidebarStudent from "./SidebarStudent.jsx";
import Header from "./Header.jsx";
import "./Sidebar.css";

export default function StudentLayout() {
  return (
    <div className="main-layout">
      <SidebarStudent />
      <div className="main-content">
        <Header />
        <div className="main-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
