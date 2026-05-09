import { Outlet } from "react-router-dom";
import SidebarAdmin from "./SidebarAdmin.jsx";
import Header from "./Header.jsx";
import "./Sidebar.css";

export default function AdminLayout() {
  return (
    <div className="main-layout">
      <SidebarAdmin />
      <div className="main-content">
        <Header />
        <div className="main-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
