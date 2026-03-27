import "../../styles/header.css";

function Header() {
  return (
    <div className="header">
      <input className="search" placeholder="Search projects, students..." />

      <div className="header-right">
        <span>🔔</span>
        <span>💬</span>
        <div className="avatar">DS</div>
      </div>
    </div>
  );
}

export default Header;
