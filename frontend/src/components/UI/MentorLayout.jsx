import { Outlet, useLocation } from "react-router-dom";
import SidebarMentor from "./SidebarMentor";
import Header from "./Header";
import RightPanel from "./RightPanel";
import "../../styles/layout.css";

function MentorLayout() {
  const { pathname } = useLocation();
  const showRightPanel = pathname.toLowerCase().startsWith("/mentor/review/");
  const layoutClassName = showRightPanel ? "layout layout--with-right" : "layout";

  return (
    <div className={layoutClassName}>
      <SidebarMentor />
      <div className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
      {showRightPanel ? <RightPanel /> : null}
    </div>
  );
}

export default MentorLayout;
