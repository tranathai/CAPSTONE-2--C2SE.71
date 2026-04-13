import Sidebar from "./Sidebar";
import Header from "./Header";
import RightPanel from "./RightPanel";
import { Outlet } from "react-router-dom";

import "../../styles/layout.css";

function Layout() {
  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Header />

        <div className="content">
          <Outlet /> {/* 👈 render page */}
        </div>
      </div>

      <RightPanel />
    </div>
  );
}

export default Layout;
